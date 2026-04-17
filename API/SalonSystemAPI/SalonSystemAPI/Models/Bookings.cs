namespace SalonSystemAPI.Models
{
    public class Bookings
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }
        public int ServiceTypeId { get; set; }
        public int? CustomerId { get; set; } // only if member
        public string? Name { get; set; } // booked or walkIn
        public string? Contact { get; set; } // booked or walkIn
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public double? Discount { get; set; }
        public double? FinalPrice { get; set; }
        public bool IsActive { get; set; } = true;
        public int StaffUserId { get; set; } // to track sales of staff 
    }
}
