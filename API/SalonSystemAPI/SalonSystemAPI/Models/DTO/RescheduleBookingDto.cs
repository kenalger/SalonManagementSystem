using System.ComponentModel.DataAnnotations;

namespace SalonSystemAPI.Models.DTO
{
    public class RescheduleBookingDto
    {
        [Required] public DateTime NewStartTime { get; set; }
    }
}
