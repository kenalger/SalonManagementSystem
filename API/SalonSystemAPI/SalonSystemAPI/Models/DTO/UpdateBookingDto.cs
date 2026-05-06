using System.ComponentModel.DataAnnotations;

namespace SalonSystemAPI.Models.DTO
{
    public class UpdateBookingDto
    {
        [Required]
        public int BranchId { get; set; }

        [Required]
        public int ServiceTypeId { get; set; }

        [Required]
        public int StaffUserId { get; set; }

        public int? CustomerId { get; set; }
        public string? Name { get; set; }
        public string? Contact { get; set; }
        public DateTime? StartTime { get; set; }

        [Range(0, double.MaxValue)]
        public double? Discount { get; set; }
    }
}
