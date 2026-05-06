using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonSystemAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceTypeIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_ServiceTypes_OrganizationId_IsActive",
                table: "ServiceTypes",
                columns: new[] { "OrganizationId", "IsActive" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ServiceTypes_OrganizationId_IsActive",
                table: "ServiceTypes");
        }
    }
}
