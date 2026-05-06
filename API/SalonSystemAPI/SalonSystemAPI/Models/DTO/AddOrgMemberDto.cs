using System.ComponentModel.DataAnnotations;

namespace SalonSystemAPI.Models.DTO
{
    public class AddOrgMemberDto
    {
        [Required] public int UserId { get; set; }
        [Required] public string Role { get; set; } = "Staff"; // Owner | Staff
    }
}
