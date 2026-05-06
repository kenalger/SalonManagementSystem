using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SalonSystemAPI.Data;

namespace SalonSystemAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BranchesController : ControllerBase
    {
        private readonly AppDbContext _db;

        public BranchesController(AppDbContext db) => _db = db;

        // GET /api/branches?orgId=
        [HttpGet]
        public async Task<IActionResult> GetByOrganization([FromQuery] int orgId)
        {
            if (orgId <= 0) return BadRequest(new { message = "orgId is required." });

            var branches = await _db.Branches
                .Where(b => b.OrganizationId == orgId && b.IsActive)
                .OrderBy(b => b.Name)
                .Select(b => new { b.Id, b.Name, b.DateCreated })
                .ToListAsync();

            return Ok(branches);
        }
    }
}
