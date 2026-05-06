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
        public async Task<IActionResult> CreateUser([FromBody] DevCreateUserDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            string[] allowedRoles = ["Admin", "User"];
            if (!allowedRoles.Contains(dto.Role))
                return BadRequest(new { message = "Role must be 'Admin' or 'User'." });

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
                Role = dto.Role
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

        [HttpPatch("users/{id}/role")]
        [Authorize(Roles = "Developer")]
        public async Task<IActionResult> UpdateUserRole(int id, [FromBody] UpdateUserRoleDto dto)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = "User not found." });

            if (user.Role == "Developer")
                return BadRequest(new { message = "Cannot change the role of a Developer account." });

            string[] allowedRoles = ["Admin", "User"];
            if (!allowedRoles.Contains(dto.Role))
                return BadRequest(new { message = "Role must be 'Admin' or 'User'." });

            user.Role = dto.Role;
            await _db.SaveChangesAsync();

            return Ok(new { user.Id, user.Role });
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
                o.IsActive,
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

        // PUT /api/developer/organizations/{id}
        [HttpPut("organizations/{id}")]
        [Authorize(Roles = "Developer")]
        public async Task<IActionResult> UpdateOrganization(int id, [FromBody] UpdateOrganizationDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var org = await _db.Organizations.FindAsync(id);
            if (org == null) return NotFound(new { message = "Organization not found." });

            org.Name = dto.Name.Trim();
            org.Description = dto.Description?.Trim() ?? org.Description;
            org.Location = dto.Location?.Trim() ?? org.Location;
            org.Email = dto.Email?.Trim() ?? org.Email;

            await _db.SaveChangesAsync();
            return Ok(new { org.Id, org.Name, org.Description, org.Location, org.Email });
        }

        // PATCH /api/developer/organizations/{id}/toggle-active
        [HttpPatch("organizations/{id}/toggle-active")]
        [Authorize(Roles = "Developer")]
        public async Task<IActionResult> ToggleOrganizationActive(int id)
        {
            var org = await _db.Organizations.FindAsync(id);
            if (org == null) return NotFound(new { message = "Organization not found." });

            org.IsActive = !org.IsActive;
            await _db.SaveChangesAsync();

            return Ok(new { org.Id, org.IsActive });
        }

        // POST /api/developer/organizations/{id}/members
        [HttpPost("organizations/{id}/members")]
        [Authorize(Roles = "Developer")]
        public async Task<IActionResult> AddOrgMember(int id, [FromBody] AddOrgMemberDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var org = await _db.Organizations.FindAsync(id);
            if (org == null) return NotFound(new { message = "Organization not found." });

            var user = await _db.Users.FindAsync(dto.UserId);
            if (user == null || !user.IsActive)
                return BadRequest(new { message = "User not found or inactive." });

            var alreadyMember = await _db.OrganizationMembers
                .AnyAsync(m => m.UserId == dto.UserId && m.OrganizationId == id);
            if (alreadyMember)
                return Conflict(new { message = "User is already a member of this organization." });

            string[] allowedRoles = ["Owner", "Staff"];
            if (!allowedRoles.Contains(dto.Role))
                return BadRequest(new { message = "Role must be 'Owner' or 'Staff'." });

            if (dto.Role == "Owner")
            {
                var existingOwner = await _db.OrganizationMembers
                    .AnyAsync(m => m.OrganizationId == id && m.Role == "Owner");
                if (existingOwner)
                    return Conflict(new { message = "This organization already has an owner." });

                var alreadyOwnsAnother = await _db.OrganizationMembers
                    .AnyAsync(m => m.UserId == dto.UserId && m.Role == "Owner");
                if (alreadyOwnsAnother)
                    return Conflict(new { message = "This user already owns another organization." });
            }

            if (dto.Role == "Staff")
            {
                var staffCount = await _db.OrganizationMembers
                    .CountAsync(m => m.OrganizationId == id && m.Role == "Staff");
                if (staffCount >= 3)
                    return BadRequest(new { message = "This organization already has the maximum of 3 staff members." });
            }

            _db.OrganizationMembers.Add(new OrganizationMembers
            {
                UserId = dto.UserId,
                OrganizationId = id,
                Role = dto.Role,
                DateJoined = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();

            return StatusCode(201, new
            {
                UserId = dto.UserId,
                UserName = $"{user.FirstName} {user.LastName}",
                dto.Role
            });
        }

        // GET /api/developer/organizations/{id}/members
        [HttpGet("organizations/{id}/members")]
        [Authorize(Roles = "Developer")]
        public async Task<IActionResult> GetOrgMembers(int id)
        {
            var exists = await _db.Organizations.AnyAsync(o => o.Id == id);
            if (!exists) return NotFound(new { message = "Organization not found." });

            var members = await (
                from m in _db.OrganizationMembers
                join u in _db.Users on m.UserId equals u.Id
                where m.OrganizationId == id
                orderby m.Role, u.FirstName
                select new
                {
                    MemberId = m.Id,
                    UserId = u.Id,
                    FullName = u.FirstName + " " + u.LastName,
                    u.Email,
                    m.Role,
                    u.IsActive,
                    m.DateJoined
                }
            ).ToListAsync();

            return Ok(members);
        }

        // GET /api/developer/organizations/{id}/branches
        [HttpGet("organizations/{id}/branches")]
        [Authorize(Roles = "Developer")]
        public async Task<IActionResult> GetOrgBranches(int id)
        {
            var exists = await _db.Organizations.AnyAsync(o => o.Id == id);
            if (!exists) return NotFound(new { message = "Organization not found." });

            var branches = await _db.Branches
                .Where(b => b.OrganizationId == id)
                .OrderByDescending(b => b.IsActive)
                .ThenBy(b => b.Name)
                .Select(b => new { b.Id, b.Name, b.IsActive, b.DateCreated })
                .ToListAsync();

            return Ok(branches);
        }

        // POST /api/developer/organizations/{id}/branches
        [HttpPost("organizations/{id}/branches")]
        [Authorize(Roles = "Developer")]
        public async Task<IActionResult> AddOrgBranch(int id, [FromBody] AddBranchDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var org = await _db.Organizations.FindAsync(id);
            if (org == null) return NotFound(new { message = "Organization not found." });

            var duplicate = await _db.Branches
                .AnyAsync(b => b.OrganizationId == id && b.Name.ToLower() == dto.Name.Trim().ToLower() && b.IsActive);
            if (duplicate)
                return Conflict(new { message = $"A branch named \"{dto.Name.Trim()}\" already exists in this organization." });

            var branch = new Branch
            {
                OrganizationId = id,
                CreatedByUserId = GetUserId(),
                Name = dto.Name.Trim(),
                DateCreated = DateTime.UtcNow,
                IsActive = true
            };
            _db.Branches.Add(branch);
            await _db.SaveChangesAsync();

            return StatusCode(201, new { branch.Id, branch.Name, branch.DateCreated });
        }
    }
}
