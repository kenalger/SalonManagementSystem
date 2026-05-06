using System.Security.Claims;
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
    public class ClientsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ClientsController(AppDbContext db) => _db = db;

        private int GetUserId() =>
            int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);

        private async Task<string?> GetOrgRole(int orgId)
        {
            var userId = GetUserId();
            var member = await _db.OrganizationMembers
                .FirstOrDefaultAsync(m => m.UserId == userId && m.OrganizationId == orgId);
            return member?.Role;
        }

        // GET /api/clients?orgId=&search=&memberOnly=&page=1&pageSize=20
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int orgId,
            [FromQuery] string? search,
            [FromQuery] bool? memberOnly,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var role = await GetOrgRole(orgId);
            if (role == null) return Forbid();

            pageSize = Math.Clamp(pageSize, 1, 500);
            page = Math.Max(1, page);

            var query = _db.Clients.Where(c => c.OrganizationId == orgId && c.IsActive);

            if (memberOnly == true)
                query = query.Where(c => c.IsMember);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(c => c.FullName.ToLower().Contains(s) || (c.Contact != null && c.Contact.Contains(s)));
            }

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            var items = await query
                .OrderBy(c => c.FullName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new
                {
                    c.Id,
                    c.FullName,
                    c.Contact,
                    c.Email,
                    c.IsMember,
                    c.MembershipStatus,
                    c.DiscountType,
                    c.DiscountValue,
                    c.ApprovedDiscountValue,
                    c.ApprovedDiscountType,
                    c.ApprovalStatus,
                    c.DateCreated,
                    c.IsActive
                })
                .ToListAsync();

            return Ok(new { items, totalCount, page, pageSize, totalPages });
        }

        // GET /api/clients/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var client = await _db.Clients.FindAsync(id);
            if (client == null) return NotFound();

            var role = await GetOrgRole(client.OrganizationId);
            if (role == null) return Forbid();

            return Ok(client);
        }

        // POST /api/clients
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateClientDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userId = GetUserId();
            var role = await GetOrgRole(dto.OrganizationId);
            if (role == null) return Forbid();

            bool hasDiscountRequest = dto.IsMember && dto.DiscountValue.HasValue && dto.DiscountValue > 0;

            var client = new Client
            {
                OrganizationId = dto.OrganizationId,
                FullName = dto.FullName.Trim(),
                Contact = dto.Contact?.Trim(),
                Email = dto.Email?.Trim(),
                IsMember = dto.IsMember,
                MembershipStatus = dto.IsMember ? (hasDiscountRequest ? "Pending" : "Active") : "Regular",
                DiscountType = hasDiscountRequest ? dto.DiscountType : null,
                DiscountValue = hasDiscountRequest ? dto.DiscountValue : null,
                ApprovalStatus = hasDiscountRequest ? "Pending" : "None",
                RequestedByUserId = hasDiscountRequest ? userId : null,
                DateCreated = DateTime.UtcNow,
                IsActive = true
            };

            _db.Clients.Add(client);
            await _db.SaveChangesAsync();

            return StatusCode(201, client);
        }

        // PUT /api/clients/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateClientDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var client = await _db.Clients.FindAsync(id);
            if (client == null || !client.IsActive) return NotFound();

            var role = await GetOrgRole(client.OrganizationId);
            if (role == null) return Forbid();

            client.FullName = dto.FullName.Trim();
            client.Contact = dto.Contact?.Trim();
            client.Email = dto.Email?.Trim();

            if (!dto.IsMember && client.IsMember)
            {
                client.IsMember = false;
                client.MembershipStatus = "Regular";
                client.DiscountType = null;
                client.DiscountValue = null;
                client.ApprovalStatus = "None";
                client.ApprovedDiscountValue = null;
                client.ApprovedDiscountType = null;
                client.ApprovedByUserId = null;
                client.DateApproved = null;
            }
            else if (dto.IsMember && !client.IsMember)
            {
                client.IsMember = true;
                client.MembershipStatus = "Active";
            }

            await _db.SaveChangesAsync();
            return Ok(client);
        }

        // PATCH /api/clients/{id}/toggle-active
        [HttpPatch("{id:int}/toggle-active")]
        public async Task<IActionResult> ToggleActive(int id)
        {
            var client = await _db.Clients.FindAsync(id);
            if (client == null) return NotFound();

            var role = await GetOrgRole(client.OrganizationId);
            if (role == null) return Forbid();

            client.IsActive = !client.IsActive;
            await _db.SaveChangesAsync();
            return Ok(new { client.Id, client.IsActive });
        }

        // GET /api/clients/pending?orgId=
        [HttpGet("pending")]
        public async Task<IActionResult> GetPending([FromQuery] int orgId)
        {
            var role = await GetOrgRole(orgId);
            if (role != "Owner") return Forbid();

            var pending = await (
                from c in _db.Clients
                join u in _db.Users on c.RequestedByUserId equals u.Id into requestedBy
                from rb in requestedBy.DefaultIfEmpty()
                where c.OrganizationId == orgId && c.ApprovalStatus == "Pending"
                orderby c.DateCreated descending
                select new
                {
                    c.Id,
                    c.FullName,
                    c.Contact,
                    c.Email,
                    c.DiscountType,
                    c.DiscountValue,
                    c.ApprovalStatus,
                    c.DateCreated,
                    RequestedBy = rb != null ? $"{rb.FirstName} {rb.LastName}" : "Unknown"
                }
            ).ToListAsync();

            return Ok(pending);
        }

        // POST /api/clients/{id}/approve-discount
        [HttpPost("{id:int}/approve-discount")]
        public async Task<IActionResult> ApproveDiscount(int id, [FromBody] ApproveDiscountDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var client = await _db.Clients.FindAsync(id);
            if (client == null) return NotFound();

            var role = await GetOrgRole(client.OrganizationId);
            if (role != "Owner") return Forbid();

            var userId = GetUserId();

            if (dto.Action == "Approve")
            {
                if (dto.DiscountValue == null || dto.DiscountValue <= 0)
                    return BadRequest(new { message = "Discount value is required to approve." });

                client.ApprovalStatus = "Approved";
                client.MembershipStatus = "Active";
                client.ApprovedDiscountType = dto.DiscountType ?? client.DiscountType;
                client.ApprovedDiscountValue = dto.DiscountValue ?? client.DiscountValue;
                client.ApprovedByUserId = userId;
                client.DateApproved = DateTime.UtcNow;
            }
            else if (dto.Action == "Reject")
            {
                client.ApprovalStatus = "Rejected";
                client.MembershipStatus = client.IsMember ? "Active" : "Regular";
                client.ApprovedByUserId = userId;
                client.DateApproved = DateTime.UtcNow;
            }
            else
            {
                return BadRequest(new { message = "Action must be Approve or Reject." });
            }

            await _db.SaveChangesAsync();
            return Ok(client);
        }
    }
}
