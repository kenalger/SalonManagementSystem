namespace SalonSystemAPI.Models.DTO
{
    public class BookingResponseDto
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }
        public int BranchId { get; set; }
        public int ServiceTypeId { get; set; }
        public string? ServiceName { get; set; }
        public int? CustomerId { get; set; }
        public string? Name { get; set; }
        public string? Contact { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public double? Discount { get; set; }
        public double? FinalPrice { get; set; }
        public string Status { get; set; } = string.Empty;
        public string BookingType { get; set; } = string.Empty;
        public string BookingReference { get; set; } = string.Empty;
        public int StaffUserId { get; set; }
        public string? StaffName { get; set; }
        public DateTime DateCreated { get; set; }
        public string? CancellationReason { get; set; }
    }
}
