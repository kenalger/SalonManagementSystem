using System.ComponentModel.DataAnnotations;

namespace SalonSystemAPI.Models.DTO
{
    public class UpdateBookingStatusDto
    {
        [Required] public string Status { get; set; } = string.Empty;
        public string? CancellationReason { get; set; }
    }
}
