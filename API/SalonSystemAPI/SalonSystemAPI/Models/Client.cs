namespace SalonSystemAPI.Models
{
    public class Client
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Contact { get; set; }
        public string? Email { get; set; }
        public bool IsMember { get; set; } = false;

        // Regular | Pending | Active
        public string MembershipStatus { get; set; } = "Regular";

        // Percent | Fixed
        public string? DiscountType { get; set; }
        public decimal? DiscountValue { get; set; }
        public decimal? ApprovedDiscountValue { get; set; }
        public string? ApprovedDiscountType { get; set; }

        // None | Pending | Approved | Rejected
        public string ApprovalStatus { get; set; } = "None";

        public int? RequestedByUserId { get; set; }
        public int? ApprovedByUserId { get; set; }
        public DateTime? DateApproved { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime DateCreated { get; set; } = DateTime.UtcNow;
    }
}
