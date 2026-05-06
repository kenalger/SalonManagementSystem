using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonSystemAPI.Migrations
{
    /// <inheritdoc />
    public partial class SeedDefaultUserRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE \"Users\" SET \"Role\" = 'User' WHERE \"Role\" = ''");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE \"Users\" SET \"Role\" = '' WHERE \"Role\" = 'User'");
        }
    }
}
