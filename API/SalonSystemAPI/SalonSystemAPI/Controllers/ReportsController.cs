using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SalonSystemAPI.Data;

namespace SalonSystemAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ReportsController(AppDbContext db) => _db = db;

        private int GetUserId() =>
            int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);

        private string GetUserRole() =>
            User.FindFirst(ClaimTypes.Role)?.Value ?? "";

        private async Task<bool> CanAccessOrg(int orgId)
        {
            var userId = GetUserId();
            var role = GetUserRole();
            if (role == "Developer" || role == "Admin") return true;
            return await _db.OrganizationMembers
                .AnyAsync(m => m.UserId == userId && m.OrganizationId == orgId);
        }

        private static (DateTime start, DateTime end) NormalizeRange(DateTime startDate, DateTime endDate)
        {
            var start = DateTime.SpecifyKind(startDate.Date, DateTimeKind.Utc);
            var end = DateTime.SpecifyKind(endDate.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
            return (start, end);
        }

        // GET /api/reports/summary?orgId=&startDate=&endDate=
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary(
            [FromQuery] int orgId,
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            if (orgId == 0) return BadRequest(new { message = "orgId is required." });
            if (!await CanAccessOrg(orgId)) return Forbid();

            var (start, end) = NormalizeRange(startDate, endDate);

            var bookings = await _db.Bookings
                .Where(b => b.OrganizationId == orgId && b.IsActive
                    && b.StartTime >= start && b.StartTime <= end)
                .ToListAsync();

            var totalBookings = bookings.Count;
            var completedBookings = bookings.Where(b => b.Status == "Completed").ToList();
            var totalSales = completedBookings.Sum(b => b.FinalPrice ?? 0);
            var cancelledCount = bookings.Count(b => b.Status == "Cancelled" || b.Status == "NoShow");
            var pendingCount = bookings.Count(b => b.Status == "Pending" || b.Status == "Confirmed");
            var completionRate = totalBookings > 0
                ? Math.Round((double)completedBookings.Count / totalBookings * 100, 1)
                : 0;

            return Ok(new
            {
                totalBookings,
                completedBookings = completedBookings.Count,
                cancelledCount,
                pendingCount,
                totalSales,
                completionRate
            });
        }

        // GET /api/reports/by-service?orgId=&startDate=&endDate=
        [HttpGet("by-service")]
        public async Task<IActionResult> GetByService(
            [FromQuery] int orgId,
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            if (orgId == 0) return BadRequest(new { message = "orgId is required." });
            if (!await CanAccessOrg(orgId)) return Forbid();

            var (start, end) = NormalizeRange(startDate, endDate);

            var bookings = await _db.Bookings
                .Where(b => b.OrganizationId == orgId && b.IsActive
                    && b.StartTime >= start && b.StartTime <= end)
                .ToListAsync();

            var serviceIds = bookings.Select(b => b.ServiceTypeId).Distinct().ToList();
            var services = await _db.ServiceTypes
                .Where(s => serviceIds.Contains(s.Id))
                .Select(s => new { s.Id, s.Name, s.Price })
                .ToListAsync();

            var result = bookings
                .GroupBy(b => b.ServiceTypeId)
                .Select(g =>
                {
                    var svc = services.FirstOrDefault(s => s.Id == g.Key);
                    var completed = g.Where(b => b.Status == "Completed").ToList();
                    return new
                    {
                        ServiceTypeId = g.Key,
                        ServiceName = svc?.Name ?? "Unknown",
                        TotalBookings = g.Count(),
                        CompletedBookings = completed.Count,
                        TotalSales = completed.Sum(b => b.FinalPrice ?? 0),
                    };
                })
                .OrderByDescending(x => x.TotalBookings)
                .ToList();

            return Ok(result);
        }

        // GET /api/reports/by-branch?orgId=&startDate=&endDate=
        [HttpGet("by-branch")]
        public async Task<IActionResult> GetByBranch(
            [FromQuery] int orgId,
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            if (orgId == 0) return BadRequest(new { message = "orgId is required." });
            if (!await CanAccessOrg(orgId)) return Forbid();

            var (start, end) = NormalizeRange(startDate, endDate);

            var bookings = await _db.Bookings
                .Where(b => b.OrganizationId == orgId && b.IsActive
                    && b.StartTime >= start && b.StartTime <= end)
                .ToListAsync();

            var branchIds = bookings.Select(b => b.BranchId).Distinct().ToList();
            var branches = await _db.Branches
                .Where(b => branchIds.Contains(b.Id))
                .Select(b => new { b.Id, b.Name })
                .ToListAsync();

            var result = bookings
                .GroupBy(b => b.BranchId)
                .Select(g =>
                {
                    var branch = branches.FirstOrDefault(b => b.Id == g.Key);
                    var completed = g.Where(b => b.Status == "Completed").ToList();
                    return new
                    {
                        BranchId = g.Key,
                        BranchName = branch?.Name ?? "Unknown",
                        TotalBookings = g.Count(),
                        CompletedBookings = completed.Count,
                        TotalSales = completed.Sum(b => b.FinalPrice ?? 0),
                    };
                })
                .OrderByDescending(x => x.TotalSales)
                .ToList();

            return Ok(result);
        }
    }
}
