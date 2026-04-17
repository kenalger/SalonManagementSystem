namespace SalonSystemAPI.Models
{
    public class ServiceType
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }
        public string Name { get; set; } 
        public string Description { get; set; }
        public DateTime DurationMinutes { get; set; }
        public double Price { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime DateCreated { get; set; }
    }
}
