using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonSystemAPI.Migrations
{
    public partial class CreateStaffTablesActual : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS ""StaffTypes"" (
                    ""Id""             serial      PRIMARY KEY,
                    ""OrganizationId"" integer     NOT NULL,
                    ""Name""           text        NOT NULL,
                    ""UserId""         integer     NOT NULL,
                    ""Description""    text        NOT NULL DEFAULT '',
                    ""IsActive""       boolean     NOT NULL DEFAULT true,
                    ""DateCreated""    timestamptz NOT NULL DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS ""StaffQuotas"" (
                    ""Id""             serial      PRIMARY KEY,
                    ""OrganizationId"" integer     NOT NULL,
                    ""StaffTypeId""    integer     NOT NULL,
                    ""UserId""         integer     NOT NULL,
                    ""BranchId""       integer,
                    ""QuotaType""      text        NOT NULL,
                    ""PeriodType""     text        NOT NULL,
                    ""StartDate""      timestamptz NOT NULL,
                    ""EndDate""        timestamptz NOT NULL,
                    ""TargetValue""    numeric     NOT NULL,
                    ""CurrentValue""   numeric     NOT NULL DEFAULT 0,
                    ""Description""    text,
                    ""IsActive""       boolean     NOT NULL DEFAULT true,
                    ""IsAchieved""     boolean     NOT NULL DEFAULT false,
                    ""DateCreated""    timestamptz NOT NULL DEFAULT NOW(),
                    ""DateUpdated""    timestamptz
                );

                CREATE INDEX IF NOT EXISTS ""IX_StaffTypes_OrganizationId_UserId_IsActive""
                    ON ""StaffTypes"" (""OrganizationId"", ""UserId"", ""IsActive"");

                CREATE INDEX IF NOT EXISTS ""IX_StaffQuotas_OrganizationId_IsActive_StartDate_EndDate""
                    ON ""StaffQuotas"" (""OrganizationId"", ""IsActive"", ""StartDate"", ""EndDate"");

                CREATE INDEX IF NOT EXISTS ""IX_StaffQuotas_UserId_OrganizationId_IsActive""
                    ON ""StaffQuotas"" (""UserId"", ""OrganizationId"", ""IsActive"");
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DROP TABLE IF EXISTS ""StaffQuotas"";
                DROP TABLE IF EXISTS ""StaffTypes"";
            ");
        }
    }
}
