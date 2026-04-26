namespace SalonSystemAPI.Models
{
    public class Branch
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }
        public int CreatedByUserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime DateCreated { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
