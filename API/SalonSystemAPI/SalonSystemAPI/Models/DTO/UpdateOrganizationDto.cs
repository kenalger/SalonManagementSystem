using System.ComponentModel.DataAnnotations;

namespace SalonSystemAPI.Models.DTO
{
    public class UpdateOrganizationDto
    {
        [Required, MaxLength(100)] public string Name { get; set; } = string.Empty;
        [MaxLength(500)] public string? Description { get; set; }
        [MaxLength(200)] public string? Location { get; set; }
        [EmailAddress, MaxLength(100)] public string? Email { get; set; }
    }
}
