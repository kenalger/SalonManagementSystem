using System.ComponentModel.DataAnnotations;

namespace SalonSystemAPI.Models.DTO
{
    public class UpdateClientDto
    {
        [Required, MaxLength(200)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Contact { get; set; }

        [MaxLength(200), EmailAddress]
        public string? Email { get; set; }

        public bool IsMember { get; set; }
    }
}
