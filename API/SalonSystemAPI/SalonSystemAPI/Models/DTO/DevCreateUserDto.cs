using System.ComponentModel.DataAnnotations;

namespace SalonSystemAPI.Models.DTO
{
    public class DevCreateUserDto
    {
        [Required] public string FirstName { get; set; } = string.Empty;
        [Required] public string LastName { get; set; } = string.Empty;
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required, MinLength(6)] public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = "User"; // Admin | User
    }
}
