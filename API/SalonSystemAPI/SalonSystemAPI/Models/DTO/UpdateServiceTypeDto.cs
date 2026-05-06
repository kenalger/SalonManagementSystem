using System.ComponentModel.DataAnnotations;

namespace SalonSystemAPI.Models.DTO
{
    public class UpdateServiceTypeDto
    {
        [Required, MaxLength(100)] public string Name { get; set; } = string.Empty;

        [MaxLength(500)] public string? Description { get; set; }

        [Range(1, 1440)] public int DurationMinutes { get; set; } = 30;

        [Range(0, double.MaxValue)] public double Price { get; set; }
    }
}
