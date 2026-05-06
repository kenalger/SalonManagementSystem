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
    public class QuotaController : ControllerBase
    {
        private readonly AppDbContext _db;

        public QuotaController(AppDbContext db) => _db = db;

        private int GetUserId() =>
            int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);

        private string GetUserRole() =>
            User.FindFirst(ClaimTypes.Role)?.Value ?? "";

        private async Task<bool> IsAdminOfOrg(int orgId)
        {
            var userId = GetUserId();
            var role = GetUserRole();

            if (role == "Admin")
                return await _db.OrganizationMembers.AnyAsync(m => m.UserId == userId && m.OrganizationId == orgId);

            if (role == "User")
                return await _db.OrganizationMembers.AnyAsync(m => m.UserId == userId && m.OrganizationId == orgId && m.Role == "Owner");

            return false;
        }

        private static decimal CompletionPct(decimal current, decimal target) =>
            target == 0 ? 0 : Math.Min(Math.Round(current / target * 100, 1), 100);

        private static string QuotaStatus(decimal current, decimal target, DateTime endDate)
        {
            var pct = target == 0 ? 0 : current / target * 100;
            if (pct >= 100) return "Achieved";
            if (DateTime.UtcNow > endDate) return "Missed";
            return pct >= 50 ? "On Track" : "Behind";
        }

        // GET /api/quota?orgId=&branchId=&classification=&period=&month=&year=&page=&pageSize=&export=
        [HttpGet]
        public async Task<IActionResult> GetReport(
            [FromQuery] int orgId,
            [FromQuery] int? branchId,
            [FromQuery] string? classification,
            [FromQuery] string? period,
            [FromQuery] int? month,
            [FromQuery] int? year,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] bool export = false)
        {
            if (orgId == 0) return BadRequest(new { message = "orgId is required." });

            var userId = GetUserId();
            var isMember = await _db.OrganizationMembers.AnyAsync(m => m.UserId == userId && m.OrganizationId == orgId);
            if (!isMember && GetUserRole() != "Developer") return Forbid();

            var query = _db.StaffQuotas.Where(q => q.OrganizationId == orgId && q.IsActive);

            if (branchId.HasValue) query = query.Where(q => q.BranchId == branchId);
            if (!string.IsNullOrWhiteSpace(classification)) query = query.Where(q => q.Classification == classification);
            if (!string.IsNullOrWhiteSpace(period)) query = query.Where(q => q.PeriodType == period);
            if (month.HasValue && year.HasValue)
            {
                var start = new DateTime(year.Value, month.Value, 1, 0, 0, 0, DateTimeKind.Utc);
                var end = start.AddMonths(1);
                query = query.Where(q => q.StartDate < end && q.EndDate >= start);
            }

            // Order in DB so pagination is consistent across pages
            var ordered = query
                .OrderByDescending(q => q.TargetValue == 0 ? 0m : q.CurrentValue / q.TargetValue)
                .ThenBy(q => q.Id);

            var totalCount = await ordered.CountAsync();

            pageSize = Math.Clamp(pageSize, 1, 100);
            page = Math.Max(1, page);
            var totalPages = totalCount == 0 ? 1 : (int)Math.Ceiling(totalCount / (double)pageSize);
            var rankOffset = (page - 1) * pageSize;

            // export=true skips pagination and returns a flat array for CSV generation
            List<StaffQuota> quotas;
            if (export)
            {
                quotas = await ordered.ToListAsync();
                rankOffset = 0;
            }
            else
            {
                quotas = await ordered.Skip(rankOffset).Take(pageSize).ToListAsync();
            }

            var userIds = quotas.Select(q => q.UserId).Distinct().ToList();
            var bIds = quotas.Where(q => q.BranchId.HasValue).Select(q => q.BranchId!.Value).Distinct().ToList();

            var users = await _db.Users.Where(u => userIds.Contains(u.Id))
                .Select(u => new { u.Id, u.FirstName, u.LastName }).ToDictionaryAsync(u => u.Id);

            var branches = await _db.Branches.Where(b => bIds.Contains(b.Id))
                .Select(b => new { b.Id, b.Name }).ToDictionaryAsync(b => b.Id);

            var items = quotas.Select((q, idx) => new
            {
                q.Id,
                q.UserId,
                UserName = users.TryGetValue(q.UserId, out var u) ? $"{u.FirstName} {u.LastName}" : "Unknown",
                q.Classification,
                BranchName = q.BranchId.HasValue && branches.TryGetValue(q.BranchId.Value, out var br) ? br.Name : "All Branches",
                q.QuotaType,
                q.PeriodType,
                q.StartDate,
                q.EndDate,
                q.TargetValue,
                q.CurrentValue,
                Remaining = Math.Max(q.TargetValue - q.CurrentValue, 0),
                CompletionPct = CompletionPct(q.CurrentValue, q.TargetValue),
                Rank = rankOffset + idx + 1,
                Status = QuotaStatus(q.CurrentValue, q.TargetValue, q.EndDate),
                q.IsAchieved,
                q.Description
            }).ToList();

            if (export)
                return Ok(items);

            return Ok(new { items, totalCount, page, pageSize, totalPages });
        }

        // GET /api/quota/dashboard?orgId=&branchId=&month=&year=
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard(
            [FromQuery] int orgId,
            [FromQuery] int? branchId,
            [FromQuery] int? month,
            [FromQuery] int? year)
        {
            if (orgId == 0) return BadRequest(new { message = "orgId is required." });

            var userId = GetUserId();
            var isMember = await _db.OrganizationMembers.AnyAsync(m => m.UserId == userId && m.OrganizationId == orgId);
            if (!isMember && GetUserRole() != "Developer") return Forbid();

            IQueryable<StaffQuota> quotaQuery;
            if (month.HasValue && year.HasValue)
            {
                var rangeStart = new DateTime(year.Value, month.Value, 1, 0, 0, 0, DateTimeKind.Utc);
                var rangeEnd = rangeStart.AddMonths(1);
                quotaQuery = _db.StaffQuotas.Where(q => q.OrganizationId == orgId && q.IsActive
                    && q.StartDate < rangeEnd && q.EndDate >= rangeStart);
            }
            else
            {
                var now = DateTime.UtcNow;
                quotaQuery = _db.StaffQuotas.Where(q => q.OrganizationId == orgId && q.IsActive
                    && q.StartDate <= now && q.EndDate >= now);
            }
            if (branchId.HasValue) quotaQuery = quotaQuery.Where(q => q.BranchId == branchId);

            var activeQuotas = await quotaQuery.ToListAsync();

            if (!activeQuotas.Any())
                return Ok(new { totalQuotaStaff = 0, achieved = 0, behind = 0, onTrack = 0, completionPct = 0 });

            var uniqueStaff = activeQuotas.Select(q => q.UserId).Distinct().Count();
            var achieved = activeQuotas.Count(q => CompletionPct(q.CurrentValue, q.TargetValue) >= 100);
            var behind = activeQuotas.Count(q => CompletionPct(q.CurrentValue, q.TargetValue) < 50);
            var onTrack = activeQuotas.Count(q =>
            {
                var pct = CompletionPct(q.CurrentValue, q.TargetValue);
                return pct >= 50 && pct < 100;
            });

            var overallPct = Math.Round(activeQuotas.Average(q => (double)CompletionPct(q.CurrentValue, q.TargetValue)), 1);

            var byUser = activeQuotas
                .GroupBy(q => q.UserId)
                .Select(g => new { UserId = g.Key, AvgPct = g.Average(q => (double)CompletionPct(q.CurrentValue, q.TargetValue)) })
                .OrderByDescending(x => x.AvgPct)
                .ToList();

            var topUserId = byUser.FirstOrDefault()?.UserId;
            var bottomUserId = byUser.LastOrDefault()?.UserId;
            var userIds = new[] { topUserId, bottomUserId }.Where(x => x.HasValue).Select(x => x!.Value).Distinct().ToList();
            var userNames = await _db.Users.Where(u => userIds.Contains(u.Id))
                .Select(u => new { u.Id, Name = $"{u.FirstName} {u.LastName}" })
                .ToDictionaryAsync(u => u.Id, u => u.Name);

            var kpiByClassification = activeQuotas
                .GroupBy(q => q.Classification ?? "General")
                .Select(g => new
                {
                    Classification = g.Key,
                    Count = g.Count(),
                    AvgCompletion = Math.Round(g.Average(q => (double)CompletionPct(q.CurrentValue, q.TargetValue)), 1)
                });

            return Ok(new
            {
                totalQuotaStaff = uniqueStaff,
                achieved,
                behind,
                onTrack,
                completionPct = overallPct,
                topPerformer = topUserId.HasValue ? new { UserId = topUserId, Name = userNames.GetValueOrDefault(topUserId.Value, "Unknown"), Pct = byUser.First().AvgPct } : null,
                lowestPerformer = bottomUserId.HasValue && bottomUserId != topUserId ? new { UserId = bottomUserId, Name = userNames.GetValueOrDefault(bottomUserId.Value, "Unknown"), Pct = byUser.Last().AvgPct } : null,
                kpiByClassification
            });
        }

        // GET /api/quota/top-performers?orgId=&branchId=&limit=
        [HttpGet("top-performers")]
        public async Task<IActionResult> GetTopPerformers([FromQuery] int orgId, [FromQuery] int? branchId, [FromQuery] int limit = 10)
        {
            if (orgId == 0) return BadRequest(new { message = "orgId is required." });

            var userId = GetUserId();
            var isMember = await _db.OrganizationMembers.AnyAsync(m => m.UserId == userId && m.OrganizationId == orgId);
            if (!isMember && GetUserRole() != "Developer") return Forbid();

            var now = DateTime.UtcNow;
            var quotaQuery = _db.StaffQuotas.Where(q => q.OrganizationId == orgId && q.IsActive
                && q.StartDate <= now && q.EndDate >= now);
            if (branchId.HasValue) quotaQuery = quotaQuery.Where(q => q.BranchId == branchId);

            var quotas = await quotaQuery.ToListAsync();
            var userIds = quotas.Select(q => q.UserId).Distinct().ToList();

            var users = await _db.Users.Where(u => userIds.Contains(u.Id))
                .Select(u => new { u.Id, u.FirstName, u.LastName }).ToDictionaryAsync(u => u.Id);

            var ranked = quotas
                .GroupBy(q => q.UserId)
                .Select(g => new
                {
                    UserId = g.Key,
                    AvgPct = g.Average(q => (double)CompletionPct(q.CurrentValue, q.TargetValue)),
                    Classification = g.Select(q => q.Classification).FirstOrDefault(c => c != null) ?? "—"
                })
                .OrderByDescending(x => x.AvgPct)
                .Take(limit)
                .Select((x, idx) => new
                {
                    Rank = idx + 1,
                    x.UserId,
                    UserName = users.TryGetValue(x.UserId, out var u) ? $"{u.FirstName} {u.LastName}" : "Unknown",
                    x.Classification,
                    CompletionPct = Math.Round(x.AvgPct, 1)
                });

            return Ok(ranked);
        }

        // POST /api/quota
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateQuotaDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (!await IsAdminOfOrg(dto.OrganizationId)) return Forbid();

            if (dto.EndDate <= dto.StartDate)
                return BadRequest(new { message = "EndDate must be after StartDate." });

            var org = await _db.Organizations.FindAsync(dto.OrganizationId);
            if (org == null || !org.IsActive) return NotFound(new { message = "Organization not found." });

            var targetUser = await _db.Users.FindAsync(dto.UserId);
            if (targetUser == null || !targetUser.IsActive)
                return BadRequest(new { message = "User not found or inactive." });

            var isMember = await _db.OrganizationMembers
                .AnyAsync(m => m.UserId == dto.UserId && m.OrganizationId == dto.OrganizationId && m.Role == "Staff");
            if (!isMember)
                return BadRequest(new { message = "User is not a Staff member of this organization." });

            var overlap = await _db.StaffQuotas.AnyAsync(q =>
                q.UserId == dto.UserId &&
                q.OrganizationId == dto.OrganizationId &&
                q.QuotaType == dto.QuotaType &&
                q.IsActive &&
                q.StartDate < dto.EndDate &&
                q.EndDate > dto.StartDate);
            if (overlap)
                return Conflict(new { message = "An active quota of this type already exists for this user in the given period." });

            var quota = new StaffQuota
            {
                OrganizationId = dto.OrganizationId,
                UserId = dto.UserId,
                BranchId = dto.BranchId,
                Classification = dto.Classification?.Trim(),
                QuotaType = dto.QuotaType.Trim(),
                PeriodType = dto.PeriodType,
                StartDate = dto.StartDate.ToUniversalTime(),
                EndDate = dto.EndDate.ToUniversalTime(),
                TargetValue = dto.TargetValue,
                CurrentValue = 0,
                Description = dto.Description?.Trim(),
                IsActive = true,
                IsAchieved = false,
                DateCreated = DateTime.UtcNow
            };

            _db.StaffQuotas.Add(quota);
            await _db.SaveChangesAsync();

            return StatusCode(201, new
            {
                quota.Id,
                quota.UserId,
                UserName = $"{targetUser.FirstName} {targetUser.LastName}",
                quota.Classification,
                quota.QuotaType,
                quota.PeriodType,
                quota.StartDate,
                quota.EndDate,
                quota.TargetValue,
                quota.CurrentValue,
                quota.IsActive
            });
        }

        // PUT /api/quota/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateQuotaDto dto)
        {
            var quota = await _db.StaffQuotas.FindAsync(id);
            if (quota == null) return NotFound(new { message = "Quota not found." });
            if (!await IsAdminOfOrg(quota.OrganizationId)) return Forbid();

            if (dto.QuotaType != null) quota.QuotaType = dto.QuotaType.Trim();
            if (dto.PeriodType != null) quota.PeriodType = dto.PeriodType;
            if (dto.StartDate.HasValue) quota.StartDate = dto.StartDate.Value.ToUniversalTime();
            if (dto.EndDate.HasValue) quota.EndDate = dto.EndDate.Value.ToUniversalTime();
            if (dto.TargetValue.HasValue) quota.TargetValue = dto.TargetValue.Value;
            if (dto.Description != null) quota.Description = dto.Description.Trim();
            quota.DateUpdated = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { quota.Id, quota.QuotaType, quota.TargetValue, quota.StartDate, quota.EndDate });
        }

        // PATCH /api/quota/{id}/progress
        [HttpPatch("{id:int}/progress")]
        public async Task<IActionResult> UpdateProgress(int id, [FromBody] UpdateQuotaProgressDto dto)
        {
            var quota = await _db.StaffQuotas.FindAsync(id);
            if (quota == null) return NotFound(new { message = "Quota not found." });

            var userId = GetUserId();
            var isMember = await _db.OrganizationMembers.AnyAsync(m => m.UserId == userId && m.OrganizationId == quota.OrganizationId);
            if (!isMember && GetUserRole() != "Developer") return Forbid();

            quota.CurrentValue = dto.CurrentValue;
            quota.IsAchieved = dto.CurrentValue >= quota.TargetValue;
            quota.DateUpdated = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                quota.Id,
                quota.CurrentValue,
                quota.TargetValue,
                CompletionPct = CompletionPct(quota.CurrentValue, quota.TargetValue),
                quota.IsAchieved
            });
        }

        // PATCH /api/quota/{id}/toggle-active
        [HttpPatch("{id:int}/toggle-active")]
        public async Task<IActionResult> ToggleActive(int id)
        {
            var quota = await _db.StaffQuotas.FindAsync(id);
            if (quota == null) return NotFound(new { message = "Quota not found." });
            if (!await IsAdminOfOrg(quota.OrganizationId)) return Forbid();

            quota.IsActive = !quota.IsActive;
            quota.DateUpdated = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { quota.Id, quota.IsActive });
        }
    }
}
