using System.ComponentModel.DataAnnotations;

namespace SalonSystemAPI.Models.DTO
{
    public class CreateClientDto
    {
        [Required, MaxLength(200)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Contact { get; set; }

        [MaxLength(200), EmailAddress]
        public string? Email { get; set; }

        public bool IsMember { get; set; } = false;

        // Percent | Fixed
        [MaxLength(20)]
        public string? DiscountType { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? DiscountValue { get; set; }

        [Required]
        public int OrganizationId { get; set; }
    }
}
