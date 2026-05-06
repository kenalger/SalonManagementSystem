using System.ComponentModel.DataAnnotations;

namespace SalonSystemAPI.Models.DTO
{
    public class UpdateUserRoleDto
    {
        [Required] public string Role { get; set; } = string.Empty;
    }
}
