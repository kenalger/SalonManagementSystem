using System.Collections.Concurrent;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using SalonSystemAPI.Data;
using SalonSystemAPI.Models;
using SalonSystemAPI.Models.DTO;

namespace SalonSystemAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _db;
        // Per-email lock: blocks duplicate concurrent register requests for the same email
        private static readonly ConcurrentDictionary<string, SemaphoreSlim> _emailLocks = new();

        public UsersController(AppDbContext db)
        {
            _db = db;
        }

        [HttpPost("register")]
        [EnableRateLimiting("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var emailKey = dto.Email.ToLowerInvariant();
            var semaphore = _emailLocks.GetOrAdd(emailKey, _ => new SemaphoreSlim(1, 1));

            if (!await semaphore.WaitAsync(0))
                return Conflict(new { message = "A registration for this email is already in progress." });

            try
            {
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
                    IsEmailConfirmed = false
                };

                _db.Users.Add(user);
                await _db.SaveChangesAsync();

                return StatusCode(201, new { message = "User registered successfully.", userId = user.Id });
            }
            finally
            {
                semaphore.Release();
                _emailLocks.TryRemove(emailKey, out _);
            }
        }
    }
}
