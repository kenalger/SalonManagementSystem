using System.ComponentModel.DataAnnotations;

namespace SalonSystemAPI.Models.DTO
{
    public class ApproveDiscountDto
    {
        // Approve | Reject
        [Required]
        public string Action { get; set; } = string.Empty;

        // Percent | Fixed (only needed on Approve)
        [MaxLength(20)]
        public string? DiscountType { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? DiscountValue { get; set; }
    }
}
