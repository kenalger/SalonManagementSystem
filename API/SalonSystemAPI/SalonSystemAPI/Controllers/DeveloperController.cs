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
    public class DeveloperController : ControllerBase
    {
        private readonly AppDbContext _db;

        public DeveloperController(AppDbContext db) => _db = db;

        private int GetUserId() =>
            int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);

        private static string GenerateInviteCode()
        {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            var random = new Random();
            return new string(Enumerable.Range(0, 8).Select(_ => chars[random.Next(chars.Length)]).ToArray());
        }

        [HttpGet("stats")]
        [Authorize(Roles = "Developer")]
        public async Task<IActionResult> GetStats()
        {
            var totalUsers = await _db.Users.CountAsync();
            var activeUsers = await _db.Users.CountAsync(u => u.IsActive);
            var totalOrgs = await _db.Organizations.CountAsync(o => o.IsActive);
            var totalBranches = await _db.Branches.CountAsync(b => b.IsActive);

            return Ok(new { totalUsers, activeUsers, totalOrgs, totalBranches });
        }

        [HttpGet("users")]
        [Authorize(Roles = "Developer")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _db.Users
                .OrderByDescending(u => u.DateCreated)
                .Select(u => new
                {
                    u.Id,
                    u.FirstName,
                    u.LastName,
                    u.Email,
                    u.Role,
                    u.IsActive,
                    u.IsEmailConfirmed,
                    u.DateCreated
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpPost("users")]
        [Authorize(Roles = "Developer")]
        public async Task<IActionResult> CreateUser([FromBody] RegisterDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var exists = await _db.Users.AnyAsync(u => u.Email == dto.Email);
            if (exists)
                return Conflict(new { message = "Email is already registered." });

            var user = new Users
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                DateCreated = DateTime.UtcNow,
                IsActive = true,
                IsEmailConfirmed = false,
                Role = "User"
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            return StatusCode(201, new
            {
                user.Id,
                user.FirstName,
                user.LastName,
                user.Email,
                user.Role,
                user.IsActive,
                user.DateCreated
            });
        }

        [HttpPatch("users/{id}/toggle-active")]
        [Authorize(Roles = "Developer")]
        public async Task<IActionResult> ToggleUserActive(int id)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = "User not found." });

            if (user.Role == "Developer")
                return BadRequest(new { message = "Cannot deactivate a Developer account." });

            user.IsActive = !user.IsActive;
            await _db.SaveChangesAsync();

            return Ok(new { user.Id, user.IsActive });
        }

        [HttpGet("organizations")]
        [Authorize(Roles = "Developer")]
        public async Task<IActionResult> GetOrganizations()
        {
            var orgs = await _db.Organizations
                .Where(o => o.IsActive)
                .OrderByDescending(o => o.DateCreated)
                .ToListAsync();

            var orgIds = orgs.Select(o => o.Id).ToList();

            var memberCounts = await _db.OrganizationMembers
                .Where(m => orgIds.Contains(m.OrganizationId))
                .GroupBy(m => m.OrganizationId)
                .Select(g => new { OrgId = g.Key, Count = g.Count() })
                .ToListAsync();

            var branches = await _db.Branches
                .Where(b => orgIds.Contains(b.OrganizationId) && b.IsActive)
                .ToListAsync();

            var owners = await (
                from m in _db.OrganizationMembers
                join u in _db.Users on m.UserId equals u.Id
                where orgIds.Contains(m.OrganizationId) && m.Role == "Owner"
                select new { m.OrganizationId, OwnerName = $"{u.FirstName} {u.LastName}", u.Email }
            ).ToListAsync();

            var result = orgs.Select(o => new
            {
                o.Id,
                o.Name,
                o.Description,
                o.Location,
                o.Email,
                o.DateCreated,
                o.InviteCode,
                MemberCount = memberCounts.FirstOrDefault(mc => mc.OrgId == o.Id)?.Count ?? 0,
                BranchCount = branches.Count(b => b.OrganizationId == o.Id),
                Owner = owners.FirstOrDefault(ow => ow.OrganizationId == o.Id)
            });

            return Ok(result);
        }

        [HttpPost("organizations")]
        [Authorize(Roles = "Developer")]
        public async Task<IActionResult> CreateOrganization([FromBody] DevCreateOrganizationDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            if (dto.OwnerUserId.HasValue)
            {
                var ownerUser = await _db.Users.FindAsync(dto.OwnerUserId.Value);
                if (ownerUser == null || !ownerUser.IsActive)
                    return BadRequest(new { message = "Specified owner user not found or inactive." });

                var alreadyOwns = await _db.OrganizationMembers
                    .AnyAsync(m => m.UserId == dto.OwnerUserId.Value && m.Role == "Owner");
                if (alreadyOwns)
                    return Conflict(new { message = "This user already owns an organization." });
            }

            await using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
                string inviteCode;
                do { inviteCode = GenerateInviteCode(); }
                while (await _db.Organizations.AnyAsync(o => o.InviteCode == inviteCode));

                var creatorId = GetUserId();

                var org = new Organization
                {
                    Name = dto.Name,
                    Description = dto.Description,
                    Location = dto.Location,
                    Email = dto.Email,
                    CreatedByUserId = creatorId,
                    DateCreated = DateTime.UtcNow,
                    IsActive = true,
                    InviteCode = inviteCode
                };
                _db.Organizations.Add(org);
                await _db.SaveChangesAsync();

                var branch = new Branch
                {
                    OrganizationId = org.Id,
                    CreatedByUserId = creatorId,
                    Name = dto.BranchName,
                    DateCreated = DateTime.UtcNow,
                    IsActive = true
                };
                _db.Branches.Add(branch);

                if (dto.OwnerUserId.HasValue)
                {
                    _db.OrganizationMembers.Add(new OrganizationMembers
                    {
                        UserId = dto.OwnerUserId.Value,
                        OrganizationId = org.Id,
                        Role = "Owner",
                        DateJoined = DateTime.UtcNow
                    });
                }

                await _db.SaveChangesAsync();
                await tx.CommitAsync();

                return StatusCode(201, new
                {
                    org.Id,
                    org.Name,
                    org.Description,
                    org.Location,
                    org.Email,
                    org.DateCreated,
                    org.InviteCode,
                    BranchName = branch.Name
                });
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }
    }
}
