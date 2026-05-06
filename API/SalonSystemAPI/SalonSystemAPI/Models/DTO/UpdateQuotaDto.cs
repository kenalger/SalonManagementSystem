using System.ComponentModel.DataAnnotations;

namespace SalonSystemAPI.Models.DTO
{
    public class UpdateQuotaDto
    {
        [MaxLength(100)] public string? QuotaType { get; set; }
        [MaxLength(20)] public string? PeriodType { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        [Range(0.01, double.MaxValue)] public decimal? TargetValue { get; set; }
        [MaxLength(500)] public string? Description { get; set; }
    }
}
