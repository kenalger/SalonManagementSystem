using System.ComponentModel.DataAnnotations;

namespace SalonSystemAPI.Models.DTO
{
    public class JoinByCodeDto
    {
        [Required]
        public string InviteCode { get; set; } = string.Empty;
    }
}
