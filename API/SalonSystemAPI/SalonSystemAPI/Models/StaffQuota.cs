namespace SalonSystemAPI.Models
{
    public class StaffQuota
    {
        public int Id { get; set; }

        public int OrganizationId { get; set; }

        public int UserId { get; set; }

        // e.g. Stylist, Barber, Receptionist
        public string? Classification { get; set; }

        // Optional branch targeting
        public int? BranchId { get; set; }

        // Example: Sales, Bookings, ClientsServed, MembershipSignup
        public string QuotaType { get; set; }

        // Daily / Weekly / Monthly / Quarterly / Yearly
        public string PeriodType { get; set; }

        // Example: June 1 - June 30
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        // Required target
        public decimal TargetValue { get; set; }

        // Current actual progress
        public decimal CurrentValue { get; set; } = 0;

        // Optional notes
        public string? Description { get; set; }

        // Active quota only
        public bool IsActive { get; set; } = true;

        // Completed automatically when reached
        public bool IsAchieved { get; set; } = false;

        public DateTime DateCreated { get; set; } = DateTime.UtcNow;
        public DateTime? DateUpdated { get; set; }
    }
}
