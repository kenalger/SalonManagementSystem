using System.ComponentModel.DataAnnotations;

namespace SalonSystemAPI.Models.DTO
{
    public class AddBranchDto
    {
        [Required, MaxLength(100)] public string Name { get; set; } = string.Empty;
    }
}
