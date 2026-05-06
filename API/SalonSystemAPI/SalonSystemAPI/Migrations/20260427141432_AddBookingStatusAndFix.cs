using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonSystemAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingStatusAndFix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // PostgreSQL cannot cast timestamp → integer implicitly; default existing rows to 30
            migrationBuilder.Sql(
                "ALTER TABLE \"ServiceTypes\" ALTER COLUMN \"DurationMinutes\" TYPE integer USING 30;");

            migrationBuilder.AddColumn<string>(
                name: "BookingReference",
                table: "Bookings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BookingType",
                table: "Bookings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CancellationReason",
                table: "Bookings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DateCreated",
                table: "Bookings",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Bookings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_BookingReference",
                table: "Bookings",
                column: "BookingReference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_OrganizationId_BranchId_StartTime",
                table: "Bookings",
                columns: new[] { "OrganizationId", "BranchId", "StartTime" });

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_StaffUserId_StartTime_EndTime",
                table: "Bookings",
                columns: new[] { "StaffUserId", "StartTime", "EndTime" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Bookings_BookingReference",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_OrganizationId_BranchId_StartTime",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_StaffUserId_StartTime_EndTime",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "BookingReference",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "BookingType",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "CancellationReason",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "DateCreated",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Bookings");

            migrationBuilder.AlterColumn<DateTime>(
                name: "DurationMinutes",
                table: "ServiceTypes",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");
        }
    }
}
