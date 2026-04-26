namespace SalonSystemAPI.Models
{
    public class OrganizationMembers
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int OrganizationId { get; set; }
        public string Role { get; set; } = "Staff"; // "Owner" or "Staff"
        public DateTime DateJoined { get; set; }
    }
}
