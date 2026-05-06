using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonSystemAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_OrganizationMembers_OrganizationId_Role",
                table: "OrganizationMembers",
                columns: new[] { "OrganizationId", "Role" });

            migrationBuilder.CreateIndex(
                name: "IX_OrganizationMembers_UserId_OrganizationId",
                table: "OrganizationMembers",
                columns: new[] { "UserId", "OrganizationId" });

            migrationBuilder.CreateIndex(
                name: "IX_Branches_OrganizationId_IsActive",
                table: "Branches",
                columns: new[] { "OrganizationId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_CustomerId",
                table: "Bookings",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_OrganizationId_Status_IsActive",
                table: "Bookings",
                columns: new[] { "OrganizationId", "Status", "IsActive" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_OrganizationMembers_OrganizationId_Role",
                table: "OrganizationMembers");

            migrationBuilder.DropIndex(
                name: "IX_OrganizationMembers_UserId_OrganizationId",
                table: "OrganizationMembers");

            migrationBuilder.DropIndex(
                name: "IX_Branches_OrganizationId_IsActive",
                table: "Branches");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_CustomerId",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_OrganizationId_Status_IsActive",
                table: "Bookings");
        }
    }
}
