using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SalonSystemAPI.Data;
using SalonSystemAPI.Models;
using SalonSystemAPI.Models.DTO;

namespace SalonSystemAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ServiceTypesController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ServiceTypesController(AppDbContext db) => _db = db;

        // GET /api/servicetypes?orgId=&search=&isActive=
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int orgId,
            [FromQuery] string? search,
            [FromQuery] bool? isActive)
        {
            if (orgId <= 0) return BadRequest(new { message = "orgId is required." });

            var query = _db.ServiceTypes.Where(s => s.OrganizationId == orgId);

            if (isActive.HasValue)
                query = query.Where(s => s.IsActive == isActive.Value);

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(s => s.Name.ToLower().Contains(search.ToLower().Trim()));

            var services = await query
                .OrderBy(s => s.Name)
                .ToListAsync();

            return Ok(services);
        }

        // GET /api/servicetypes/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var service = await _db.ServiceTypes.FindAsync(id);
            if (service == null) return NotFound(new { message = "Service not found." });
            return Ok(service);
        }

        // POST /api/servicetypes
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateServiceTypeDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var nameNormalized = dto.Name.Trim().ToLower();

            var duplicate = await _db.ServiceTypes.AnyAsync(s =>
                s.OrganizationId == dto.OrganizationId &&
                s.Name.ToLower() == nameNormalized);

            if (duplicate)
                return Conflict(new { message = $"A service named \"{dto.Name.Trim()}\" already exists in this organization." });

            var service = new ServiceType
            {
                OrganizationId = dto.OrganizationId,
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim() ?? string.Empty,
                DurationMinutes = dto.DurationMinutes,
                Price = dto.Price,
                IsActive = true,
                DateCreated = DateTime.UtcNow
            };

            _db.ServiceTypes.Add(service);
            await _db.SaveChangesAsync();

            return StatusCode(201, service);
        }

        // PUT /api/servicetypes/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateServiceTypeDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var service = await _db.ServiceTypes.FindAsync(id);
            if (service == null) return NotFound(new { message = "Service not found." });

            var nameNormalized = dto.Name.Trim().ToLower();

            var duplicate = await _db.ServiceTypes.AnyAsync(s =>
                s.OrganizationId == service.OrganizationId &&
                s.Name.ToLower() == nameNormalized &&
                s.Id != id);

            if (duplicate)
                return Conflict(new { message = $"A service named \"{dto.Name.Trim()}\" already exists in this organization." });

            service.Name = dto.Name.Trim();
            service.Description = dto.Description?.Trim() ?? string.Empty;
            service.DurationMinutes = dto.DurationMinutes;
            service.Price = dto.Price;

            await _db.SaveChangesAsync();
            return Ok(service);
        }

        // PATCH /api/servicetypes/{id}/toggle-active
        [HttpPatch("{id}/toggle-active")]
        public async Task<IActionResult> ToggleActive(int id)
        {
            var service = await _db.ServiceTypes.FindAsync(id);
            if (service == null) return NotFound(new { message = "Service not found." });

            // Prevent deactivating a service that has active future bookings
            if (service.IsActive)
            {
                var hasActiveBookings = await _db.Bookings.AnyAsync(b =>
                    b.ServiceTypeId == id &&
                    b.IsActive &&
                    b.Status != "Completed" &&
                    b.Status != "Cancelled" &&
                    b.Status != "NoShow" &&
                    b.StartTime > DateTime.UtcNow);

                if (hasActiveBookings)
                    return Conflict(new { message = "Cannot deactivate a service with upcoming active bookings." });
            }

            service.IsActive = !service.IsActive;
            await _db.SaveChangesAsync();

            return Ok(new { service.Id, service.IsActive });
        }

        // POST /api/servicetypes/{id}/duplicate
        [HttpPost("{id}/duplicate")]
        public async Task<IActionResult> Duplicate(int id)
        {
            var source = await _db.ServiceTypes.FindAsync(id);
            if (source == null) return NotFound(new { message = "Service not found." });

            // Generate a unique name: "Copy of X", "Copy of X (2)", etc.
            var baseName = $"Copy of {source.Name}";
            var candidateName = baseName;
            var counter = 2;

            while (await _db.ServiceTypes.AnyAsync(s =>
                s.OrganizationId == source.OrganizationId &&
                s.Name.ToLower() == candidateName.ToLower()))
            {
                candidateName = $"{baseName} ({counter++})";
            }

            var copy = new ServiceType
            {
                OrganizationId = source.OrganizationId,
                Name = candidateName,
                Description = source.Description,
                DurationMinutes = source.DurationMinutes,
                Price = source.Price,
                IsActive = false,
                DateCreated = DateTime.UtcNow
            };

            _db.ServiceTypes.Add(copy);
            await _db.SaveChangesAsync();

            return StatusCode(201, copy);
        }

        // DELETE /api/servicetypes/{id} — soft delete
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var service = await _db.ServiceTypes.FindAsync(id);
            if (service == null) return NotFound(new { message = "Service not found." });

            var linkedBookings = await _db.Bookings.AnyAsync(b =>
                b.ServiceTypeId == id &&
                b.IsActive &&
                b.Status != "Completed" &&
                b.Status != "Cancelled" &&
                b.Status != "NoShow");

            if (linkedBookings)
                return Conflict(new { message = "Cannot delete a service with active bookings. Deactivate it instead." });

            service.IsActive = false;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Service deleted (deactivated)." });
        }

        // GET /api/servicetypes/metrics?orgId=
        [HttpGet("metrics")]
        public async Task<IActionResult> GetMetrics([FromQuery] int orgId)
        {
            if (orgId <= 0) return BadRequest(new { message = "orgId is required." });

            var all = await _db.ServiceTypes
                .Where(s => s.OrganizationId == orgId)
                .ToListAsync();

            var active = all.Where(s => s.IsActive).ToList();
            var inactive = all.Where(s => !s.IsActive).ToList();

            return Ok(new
            {
                TotalActive = active.Count,
                TotalInactive = inactive.Count,
                AvgDurationMinutes = active.Count > 0 ? (int)active.Average(s => s.DurationMinutes) : 0,
                AvgPrice = active.Count > 0 ? active.Average(s => s.Price) : 0
            });
        }
    }
}
