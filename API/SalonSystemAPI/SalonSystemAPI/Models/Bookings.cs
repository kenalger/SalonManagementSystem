namespace SalonSystemAPI.Models
{
    public class Bookings
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }
        public int BranchId { get; set; }
        public int ServiceTypeId { get; set; }
        public int? CustomerId { get; set; }
        public string? Name { get; set; }
        public string? Contact { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public double? Discount { get; set; }
        public double? FinalPrice { get; set; }
        public bool IsActive { get; set; } = true;
        public int StaffUserId { get; set; }

        // Pending | Confirmed | CheckedIn | Ongoing | Completed | Cancelled | NoShow | Rescheduled
        public string Status { get; set; } = "Pending";

        // Member | Guest | WalkIn
        public string BookingType { get; set; } = "Guest";

        public string BookingReference { get; set; } = string.Empty;
        public DateTime DateCreated { get; set; }
        public string? CancellationReason { get; set; }
    }
}
