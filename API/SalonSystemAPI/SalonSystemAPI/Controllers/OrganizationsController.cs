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

            var results = await (
                from m in _db.OrganizationMembers
                join o in _db.Organizations on m.OrganizationId equals o.Id
                where m.UserId == userId && o.IsActive
                select new
                {
                    Org = o,
                    Member = m
                }
            ).ToListAsync();

            var orgIds = results.Select(r => r.Org.Id).ToList();

            var branches = await _db.Branches
                .Where(b => orgIds.Contains(b.OrganizationId) && b.IsActive)
                .ToListAsync();

            var staffCounts = await _db.OrganizationMembers
                .Where(m => orgIds.Contains(m.OrganizationId) && m.Role == "Staff")
                .GroupBy(m => m.OrganizationId)
                .Select(g => new { OrgId = g.Key, Count = g.Count() })
                .ToListAsync();

            var response = results.Select(r =>
            {
                var branch = branches.FirstOrDefault(b => b.OrganizationId == r.Org.Id);
                var staffCount = staffCounts.FirstOrDefault(sc => sc.OrgId == r.Org.Id)?.Count ?? 0;

                return new OrganizationResponseDto
                {
                    Id = r.Org.Id,
                    Name = r.Org.Name,
                    Description = r.Org.Description,
                    Location = r.Org.Location,
                    Email = r.Org.Email,
                    DateCreated = r.Org.DateCreated,
                    InviteCode = r.Member.Role == "Owner" ? r.Org.InviteCode : null,
                    BranchName = branch?.Name,
                    UserRole = r.Member.Role,
                    StaffCount = staffCount
                };
            }).ToList();

            return Ok(response);
        }

        [HttpPost]
        [Authorize(Roles = "Developer")]
        public async Task<IActionResult> Create([FromBody] CreateOrganizationDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userId = GetUserId();

            var alreadyOwns = await _db.OrganizationMembers
                .AnyAsync(m => m.UserId == userId && m.Role == "Owner");

            if (alreadyOwns)
                return Conflict(new { message = "You already own an organization." });

            await using var tx = await _db.Database.BeginTransactionAsync();

            try
            {
                string inviteCode;
                do { inviteCode = GenerateInviteCode(); }
                while (await _db.Organizations.AnyAsync(o => o.InviteCode == inviteCode));

                var org = new Organization
                {
                    Name = dto.Name,
                    Description = dto.Description,
                    Location = dto.Location,
                    Email = dto.Email,
                    CreatedByUserId = userId,
                    DateCreated = DateTime.UtcNow,
                    IsActive = true,
                    InviteCode = inviteCode
                };
                _db.Organizations.Add(org);
                await _db.SaveChangesAsync();

                var branch = new Branch
                {
                    OrganizationId = org.Id,
                    CreatedByUserId = userId,
                    Name = dto.BranchName,
                    DateCreated = DateTime.UtcNow,
                    IsActive = true
                };
                _db.Branches.Add(branch);

                _db.OrganizationMembers.Add(new OrganizationMembers
                {
                    UserId = userId,
                    OrganizationId = org.Id,
                    Role = "Owner",
                    DateJoined = DateTime.UtcNow
                });

                await _db.SaveChangesAsync();
                await tx.CommitAsync();

                return StatusCode(201, new OrganizationResponseDto
                {
                    Id = org.Id,
                    Name = org.Name,
                    Description = org.Description,
                    Location = org.Location,
                    Email = org.Email,
                    DateCreated = org.DateCreated,
                    InviteCode = org.InviteCode,
                    BranchName = branch.Name,
                    UserRole = "Owner",
                    StaffCount = 0
                });
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }

        [HttpPost("join")]
        public async Task<IActionResult> JoinByCode([FromBody] JoinByCodeDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userId = GetUserId();
            var code = dto.InviteCode.Trim().ToUpperInvariant();
            var now = DateTime.UtcNow;

            var org = await _db.Organizations
                .FirstOrDefaultAsync(o => o.InviteCode == code && o.IsActive);

            if (org == null)
                return NotFound(new { message = "Invalid invite code." });

            var alreadyMember = await _db.OrganizationMembers
                .AnyAsync(m => m.UserId == userId && m.OrganizationId == org.Id);

            if (alreadyMember)
                return Conflict(new { message = "You are already a member of this organization." });

            var staffCount = await _db.OrganizationMembers
                .CountAsync(m => m.OrganizationId == org.Id && m.Role == "Staff");

            if (staffCount >= 3)
                return BadRequest(new { message = "This organization has reached the maximum of 3 staff members." });

            _db.OrganizationMembers.Add(new OrganizationMembers
            {
                UserId = userId,
                OrganizationId = org.Id,
                Role = "Staff",
                DateJoined = now
            });

            await _db.SaveChangesAsync();

            return Ok(new OrganizationResponseDto
            {
                Id = org.Id,
                Name = org.Name,
                Description = org.Description,
                Location = org.Location,
                Email = org.Email,
                DateCreated = org.DateCreated,
                UserRole = "Staff"
            });
        }
    }
}
