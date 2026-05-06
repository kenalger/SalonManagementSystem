using System.ComponentModel.DataAnnotations;

namespace SalonSystemAPI.Models.DTO
{
    public class CreateQuotaDto
    {
        [Required] public int OrganizationId { get; set; }
        [Required] public int UserId { get; set; }
        public int? BranchId { get; set; }
        [MaxLength(100)] public string? Classification { get; set; }
        [Required, MaxLength(100)] public string QuotaType { get; set; } = string.Empty;
        [Required, MaxLength(20)] public string PeriodType { get; set; } = "Monthly";
        [Required] public DateTime StartDate { get; set; }
        [Required] public DateTime EndDate { get; set; }
        [Required, Range(0.01, double.MaxValue)] public decimal TargetValue { get; set; }
        [MaxLength(500)] public string? Description { get; set; }
    }
}
