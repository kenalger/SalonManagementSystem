namespace SalonSystemAPI.Models
{
    public class Organization
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string Location { get; set; }
        public string Email { get; set; }
        public DateTime DateCreated { get; set; }
        public bool IsActive { get; set; } = true;
        public string InviteCode { get; set; } = string.Empty;
    }
}
