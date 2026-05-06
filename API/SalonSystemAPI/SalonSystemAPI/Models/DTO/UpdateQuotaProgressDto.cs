using System.ComponentModel.DataAnnotations;

namespace SalonSystemAPI.Models.DTO
{
    public class UpdateQuotaProgressDto
    {
        [Required, Range(0, double.MaxValue)] public decimal CurrentValue { get; set; }
    }
}
