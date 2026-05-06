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
    public class BookingsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public BookingsController(AppDbContext db) => _db = db;

        private int GetUserId() =>
            int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);

        private static string GenerateReference()
        {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            var random = new Random();
            return "BK-" + new string(Enumerable.Range(0, 6)
                .Select(_ => chars[random.Next(chars.Length)]).ToArray());
        }

        private static readonly string[] ValidStatuses =
            ["Pending", "Confirmed", "CheckedIn", "Ongoing", "Completed", "Cancelled", "NoShow", "Rescheduled"];

        // GET /api/bookings?orgId=&branchId=&date=&status=&page=1&pageSize=20
        [HttpGet]
        public async Task<IActionResult> GetBookings(
            [FromQuery] int orgId,
            [FromQuery] int? branchId,
            [FromQuery] DateTime? date,
            [FromQuery] string? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            pageSize = Math.Clamp(pageSize, 1, 100);
            page = Math.Max(1, page);

            var query = _db.Bookings
                .Where(b => b.OrganizationId == orgId && b.IsActive);

            if (branchId.HasValue)
                query = query.Where(b => b.BranchId == branchId.Value);

            if (date.HasValue)
            {
                var day = date.Value.Date;
                query = query.Where(b => b.StartTime.Date == day);
            }

            if (!string.IsNullOrEmpty(status))
                query = query.Where(b => b.Status == status);

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            var bookings = await query
                .OrderByDescending(b => b.StartTime)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var staffIds = bookings.Select(b => b.StaffUserId).Distinct().ToList();
            var serviceIds = bookings.Select(b => b.ServiceTypeId).Distinct().ToList();

            var staff = await _db.Users
                .Where(u => staffIds.Contains(u.Id))
                .Select(u => new { u.Id, FullName = u.FirstName + " " + u.LastName })
                .ToListAsync();

            var services = await _db.ServiceTypes
                .Where(s => serviceIds.Contains(s.Id))
                .Select(s => new { s.Id, s.Name, s.Price, s.DurationMinutes })
                .ToListAsync();

            var items = bookings.Select(b => new BookingResponseDto
            {
                Id = b.Id,
                OrganizationId = b.OrganizationId,
                BranchId = b.BranchId,
                ServiceTypeId = b.ServiceTypeId,
                ServiceName = services.FirstOrDefault(s => s.Id == b.ServiceTypeId)?.Name,
                CustomerId = b.CustomerId,
                Name = b.Name,
                Contact = b.Contact,
                StartTime = b.StartTime,
                EndTime = b.EndTime,
                Discount = b.Discount,
                FinalPrice = b.FinalPrice,
                Status = b.Status,
                BookingType = b.BookingType,
                BookingReference = b.BookingReference,
                StaffUserId = b.StaffUserId,
                StaffName = staff.FirstOrDefault(s => s.Id == b.StaffUserId)?.FullName,
                DateCreated = b.DateCreated,
                CancellationReason = b.CancellationReason
            }).ToList();

            return Ok(new { items, totalCount, page, pageSize, totalPages });
        }

        // POST /api/bookings
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateBookingDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var service = await _db.ServiceTypes.FindAsync(dto.ServiceTypeId);
            if (service == null || !service.IsActive)
                return BadRequest(new { message = "Service not found or inactive." });

            var isMember = await _db.OrganizationMembers
                .AnyAsync(m => m.UserId == dto.StaffUserId && m.OrganizationId == dto.OrganizationId);
            if (!isMember)
                return BadRequest(new { message = "Selected staff is not a member of this organization." });

            var startTime = dto.BookingType == "WalkIn" ? DateTime.UtcNow : dto.StartTime;
            var endTime = startTime.AddMinutes(service.DurationMinutes);

            if (dto.BookingType != "WalkIn" && startTime <= DateTime.UtcNow)
                return BadRequest(new { message = "Booking start time must be in the future." });

            if (dto.BookingType == "Member" && !dto.CustomerId.HasValue)
                return BadRequest(new { message = "Customer ID is required for member bookings." });

            if (dto.BookingType != "Member" && string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Name is required for guest and walk-in bookings." });

            var overlapping = await _db.Bookings.AnyAsync(b =>
                b.StaffUserId == dto.StaffUserId &&
                b.IsActive &&
                b.Status != "Cancelled" && b.Status != "NoShow" && b.Status != "Completed" &&
                b.StartTime < endTime && b.EndTime > startTime);

            if (overlapping)
                return Conflict(new { message = "Staff is already booked for this time slot." });

            var discount = dto.Discount ?? 0;
            var finalPrice = Math.Max(0, service.Price - discount);

            string reference;
            do { reference = GenerateReference(); }
            while (await _db.Bookings.AnyAsync(b => b.BookingReference == reference));

            var booking = new Bookings
            {
                OrganizationId = dto.OrganizationId,
                BranchId = dto.BranchId,
                ServiceTypeId = dto.ServiceTypeId,
                CustomerId = dto.CustomerId,
                Name = dto.Name,
                Contact = dto.Contact,
                StartTime = startTime,
                EndTime = endTime,
                Discount = discount,
                FinalPrice = finalPrice,
                IsActive = true,
                StaffUserId = dto.StaffUserId,
                Status = dto.BookingType == "WalkIn" ? "Confirmed" : "Pending",
                BookingType = dto.BookingType,
                BookingReference = reference,
                DateCreated = DateTime.UtcNow
            };

            _db.Bookings.Add(booking);
            await _db.SaveChangesAsync();

            return StatusCode(201, new
            {
                booking.Id,
                booking.BookingReference,
                booking.Status,
                booking.StartTime,
                booking.EndTime,
                booking.FinalPrice
            });
        }

        // PUT /api/bookings/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateBookingDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var booking = await _db.Bookings.FindAsync(id);
            if (booking == null || !booking.IsActive)
                return NotFound(new { message = "Booking not found." });

            if (booking.Status is "Completed" or "Cancelled" or "NoShow")
                return BadRequest(new { message = "Cannot edit a completed, cancelled, or no-show booking." });

            var service = await _db.ServiceTypes.FindAsync(dto.ServiceTypeId);
            if (service == null || !service.IsActive)
                return BadRequest(new { message = "Service not found or inactive." });

            var isMember = await _db.OrganizationMembers
                .AnyAsync(m => m.UserId == dto.StaffUserId && m.OrganizationId == booking.OrganizationId);
            if (!isMember)
                return BadRequest(new { message = "Selected staff is not a member of this organization." });

            var startTime = booking.BookingType == "WalkIn"
                ? booking.StartTime
                : (dto.StartTime ?? booking.StartTime);

            if (booking.BookingType != "WalkIn" && startTime <= DateTime.UtcNow)
                return BadRequest(new { message = "Booking start time must be in the future." });

            var endTime = startTime.AddMinutes(service.DurationMinutes);

            var overlapping = await _db.Bookings.AnyAsync(b =>
                b.Id != id &&
                b.StaffUserId == dto.StaffUserId &&
                b.IsActive &&
                b.Status != "Cancelled" && b.Status != "NoShow" && b.Status != "Completed" &&
                b.StartTime < endTime && b.EndTime > startTime);

            if (overlapping)
                return Conflict(new { message = "Staff is already booked for this time slot." });

            var discount = dto.Discount ?? 0;

            booking.BranchId = dto.BranchId;
            booking.ServiceTypeId = dto.ServiceTypeId;
            booking.StaffUserId = dto.StaffUserId;
            booking.CustomerId = dto.CustomerId;
            booking.Name = dto.Name;
            booking.Contact = dto.Contact;
            booking.StartTime = startTime;
            booking.EndTime = endTime;
            booking.Discount = discount;
            booking.FinalPrice = Math.Max(0, service.Price - discount);

            await _db.SaveChangesAsync();

            return Ok(new
            {
                booking.Id,
                booking.BookingReference,
                booking.Status,
                booking.StartTime,
                booking.EndTime,
                booking.FinalPrice
            });
        }

        // PATCH /api/bookings/{id}/status
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateBookingStatusDto dto)
        {
            var booking = await _db.Bookings.FindAsync(id);
            if (booking == null || !booking.IsActive)
                return NotFound(new { message = "Booking not found." });

            if (!ValidStatuses.Contains(dto.Status))
                return BadRequest(new { message = "Invalid status." });

            booking.Status = dto.Status;

            if (dto.Status == "Cancelled" && !string.IsNullOrWhiteSpace(dto.CancellationReason))
                booking.CancellationReason = dto.CancellationReason;

            await _db.SaveChangesAsync();
            return Ok(new { booking.Id, booking.Status });
        }

        // PATCH /api/bookings/{id}/reschedule
        [HttpPatch("{id}/reschedule")]
        public async Task<IActionResult> Reschedule(int id, [FromBody] RescheduleBookingDto dto)
        {
            var booking = await _db.Bookings.FindAsync(id);
            if (booking == null || !booking.IsActive)
                return NotFound(new { message = "Booking not found." });

            if (booking.Status is "Completed" or "Cancelled" or "NoShow")
                return BadRequest(new { message = "Cannot reschedule this booking." });

            var service = await _db.ServiceTypes.FindAsync(booking.ServiceTypeId);
            var newEnd = dto.NewStartTime.AddMinutes(service!.DurationMinutes);

            var overlapping = await _db.Bookings.AnyAsync(b =>
                b.Id != id &&
                b.StaffUserId == booking.StaffUserId &&
                b.IsActive &&
                b.Status != "Cancelled" && b.Status != "NoShow" && b.Status != "Completed" &&
                b.StartTime < newEnd && b.EndTime > dto.NewStartTime);

            if (overlapping)
                return Conflict(new { message = "Staff is already booked for the new time slot." });

            booking.StartTime = dto.NewStartTime;
            booking.EndTime = newEnd;
            booking.Status = "Rescheduled";
            await _db.SaveChangesAsync();

            return Ok(new { booking.Id, booking.StartTime, booking.EndTime, booking.Status });
        }

        // DELETE /api/bookings/{id} — soft cancel
        [HttpDelete("{id}")]
        public async Task<IActionResult> Cancel(int id, [FromQuery] string? reason)
        {
            var booking = await _db.Bookings.FindAsync(id);
            if (booking == null || !booking.IsActive)
                return NotFound(new { message = "Booking not found." });

            if (booking.Status is "Completed" or "Cancelled")
                return BadRequest(new { message = "Booking is already completed or cancelled." });

            booking.Status = "Cancelled";
            booking.CancellationReason = reason;
            await _db.SaveChangesAsync();

            return Ok(new { booking.Id, booking.Status });
        }

        // GET /api/bookings/available-staff?orgId=&branchId=&startTime=&serviceTypeId=
        [HttpGet("available-staff")]
        public async Task<IActionResult> GetAvailableStaff(
            [FromQuery] int orgId,
            [FromQuery] int branchId,
            [FromQuery] DateTime startTime,
            [FromQuery] int serviceTypeId)
        {
            var service = await _db.ServiceTypes.FindAsync(serviceTypeId);
            if (service == null) return BadRequest(new { message = "Service not found." });

            var endTime = startTime.AddMinutes(service.DurationMinutes);

            var orgStaff = await (
                from m in _db.OrganizationMembers
                join u in _db.Users on m.UserId equals u.Id
                where m.OrganizationId == orgId && u.IsActive
                select new { u.Id, FullName = u.FirstName + " " + u.LastName, m.Role }
            ).ToListAsync();

            var bookedIds = await _db.Bookings
                .Where(b =>
                    b.BranchId == branchId &&
                    b.IsActive &&
                    b.Status != "Cancelled" && b.Status != "NoShow" && b.Status != "Completed" &&
                    b.StartTime < endTime && b.EndTime > startTime)
                .Select(b => b.StaffUserId)
                .Distinct()
                .ToListAsync();

            var result = orgStaff.Select(s => new
            {
                s.Id,
                s.FullName,
                s.Role,
                IsAvailable = !bookedIds.Contains(s.Id)
            });

            return Ok(result);
        }

        // GET /api/bookings/next-slot?staffId=&serviceTypeId=&after=
        [HttpGet("next-slot")]
        public async Task<IActionResult> GetNextSlot(
            [FromQuery] int staffId,
            [FromQuery] int serviceTypeId,
            [FromQuery] DateTime? after)
        {
            var service = await _db.ServiceTypes.FindAsync(serviceTypeId);
            if (service == null) return BadRequest(new { message = "Service not found." });

            var start = after.HasValue && after.Value > DateTime.UtcNow ? after.Value : DateTime.UtcNow;
            var remainder = start.Minute % 30;
            if (remainder != 0) start = start.AddMinutes(30 - remainder);
            start = new DateTime(start.Year, start.Month, start.Day, start.Hour, start.Minute, 0, DateTimeKind.Utc);

            var upcoming = await _db.Bookings
                .Where(b =>
                    b.StaffUserId == staffId &&
                    b.IsActive &&
                    b.Status != "Cancelled" && b.Status != "NoShow" && b.Status != "Completed" &&
                    b.StartTime >= start)
                .OrderBy(b => b.StartTime)
                .ToListAsync();

            for (int i = 0; i < 48; i++)
            {
                var slotEnd = start.AddMinutes(service.DurationMinutes);
                var conflict = upcoming.Any(b => b.StartTime < slotEnd && b.EndTime > start);
                if (!conflict)
                    return Ok(new { nextAvailableSlot = start });
                start = start.AddMinutes(30);
            }

            return Ok(new { nextAvailableSlot = (DateTime?)null, message = "No slot available in the next 24 hours." });
        }

        // GET /api/bookings/dashboard?orgId=&branchId=&date=
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard(
            [FromQuery] int orgId,
            [FromQuery] int? branchId,
            [FromQuery] DateTime? date)
        {
            var day = (date ?? DateTime.UtcNow).Date;
            var tomorrow = day.AddDays(1);

            var query = _db.Bookings
                .Where(b => b.OrganizationId == orgId && b.IsActive &&
                            b.StartTime >= day && b.StartTime < tomorrow);

            if (branchId.HasValue)
                query = query.Where(b => b.BranchId == branchId.Value);

            var todays = await query.ToListAsync();

            return Ok(new
            {
                TodayTotal = todays.Count,
                Ongoing = todays.Count(b => b.Status == "Ongoing"),
                Completed = todays.Count(b => b.Status == "Completed"),
                Pending = todays.Count(b => b.Status is "Pending" or "Confirmed" or "CheckedIn"),
                RevenueToday = todays.Where(b => b.Status == "Completed").Sum(b => b.FinalPrice ?? 0)
            });
        }

        // GET /api/bookings/services?orgId=
        [HttpGet("services")]
        public async Task<IActionResult> GetServices([FromQuery] int orgId)
        {
            var services = await _db.ServiceTypes
                .Where(s => s.OrganizationId == orgId && s.IsActive)
                .Select(s => new { s.Id, s.Name, s.Price, s.DurationMinutes, s.Description })
                .ToListAsync();

            return Ok(services);
        }

        // GET /api/bookings/org-staff?orgId=
        [HttpGet("org-staff")]
        public async Task<IActionResult> GetOrgStaff([FromQuery] int orgId)
        {
            var staff = await (
                from m in _db.OrganizationMembers
                join u in _db.Users on m.UserId equals u.Id
                where m.OrganizationId == orgId && u.IsActive
                select new { u.Id, FullName = u.FirstName + " " + u.LastName, m.Role }
            ).ToListAsync();

            return Ok(staff);
        }

        // GET /api/bookings/branches?orgId=
        [HttpGet("branches")]
        public async Task<IActionResult> GetBranches([FromQuery] int orgId)
        {
            var branches = await _db.Branches
                .Where(b => b.OrganizationId == orgId && b.IsActive)
                .Select(b => new { b.Id, b.Name })
                .ToListAsync();

            return Ok(branches);
        }
    }
}
