using System.Security.Claims;
using System.Text;
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
    public class OrganizationsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public OrganizationsController(AppDbContext db) => _db = db;

        private int GetUserId() =>
            int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);

        private static string GenerateInviteCode()
        {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            var random = new Random();
            return new string(Enumerable.Range(0, 8).Select(_ => chars[random.Next(chars.Length)]).ToArray());
        }

        [HttpGet("mine")]
        public async Task<IActionResult> GetMyOrganizations()
        {
            var userId = GetUserId();
            var orgs = await (from m in _db.OrganizationMembers
                              join o in _db.Organizations on m.OrganizationId equals o.Id
                              where m.UserId == userId && o.IsActive
                              select new OrganizationResponseDto
                              {
                                  Id = o.Id,
                                  Name = o.Name,
                                  Description = o.Description,
                                  Location = o.Location,
                                  Email = o.Email,
                                  DateCreated = o.DateCreated
                              }).ToListAsync();

            return Ok(orgs);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateOrganizationDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userId = GetUserId();

            string inviteCode;
            do { inviteCode = GenerateInviteCode(); }
            while (await _db.Organizations.AnyAsync(o => o.InviteCode == inviteCode));

            var org = new Organization
            {
                Name = dto.Name,
                Description = dto.Description,
                Location = dto.Location,
                Email = dto.Email,
                DateCreated = DateTime.UtcNow,
                IsActive = true,
                InviteCode = inviteCode
            };

            _db.Organizations.Add(org);
            await _db.SaveChangesAsync();

            _db.OrganizationMembers.Add(new OrganizationMembers
            {
                UserId = userId,
                OrganizationId = org.Id,
                DateJoined = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();

            return StatusCode(201, new OrganizationResponseDto
            {
                Id = org.Id,
                Name = org.Name,
                Description = org.Description,
                Location = org.Location,
                Email = org.Email,
                DateCreated = org.DateCreated,
                InviteCode = org.InviteCode
            });
        }

        [HttpPost("join")]
        public async Task<IActionResult> JoinByCode([FromBody] JoinByCodeDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userId = GetUserId();
            var code = dto.InviteCode.Trim().ToUpperInvariant();

            var org = await _db.Organizations
                .FirstOrDefaultAsync(o => o.InviteCode == code && o.IsActive);

            if (org == null)
                return NotFound(new { message = "Invalid invite code." });

            var alreadyMember = await _db.OrganizationMembers
                .AnyAsync(m => m.UserId == userId && m.OrganizationId == org.Id);

            if (alreadyMember)
                return Conflict(new { message = "You are already a member of this organization." });

            _db.OrganizationMembers.Add(new OrganizationMembers
            {
                UserId = userId,
                OrganizationId = org.Id,
                DateJoined = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();

            return Ok(new OrganizationResponseDto
            {
                Id = org.Id,
                Name = org.Name,
                Description = org.Description,
                Location = org.Location,
                Email = org.Email,
                DateCreated = org.DateCreated
            });
        }
    }
}
