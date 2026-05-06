using System.ComponentModel.DataAnnotations;

namespace SalonSystemAPI.Models.DTO
{
    public class CreateBookingDto
    {
        [Required] public int OrganizationId { get; set; }
        [Required] public int BranchId { get; set; }
        [Required] public int ServiceTypeId { get; set; }
        [Required] public int StaffUserId { get; set; }

        // Member | Guest | WalkIn
        [Required] public string BookingType { get; set; } = "Guest";

        public int? CustomerId { get; set; }
        public string? Name { get; set; }
        public string? Contact { get; set; }
        public DateTime StartTime { get; set; }
        public double? Discount { get; set; }
    }
}
