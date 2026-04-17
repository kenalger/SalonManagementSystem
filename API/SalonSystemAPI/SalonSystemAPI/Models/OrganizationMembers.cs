namespace SalonSystemAPI.Models
{
    public class OrganizationMembers
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int OrganizationId { get; set; }
        public DateTime DateJoined { get; set; }
    }
}
