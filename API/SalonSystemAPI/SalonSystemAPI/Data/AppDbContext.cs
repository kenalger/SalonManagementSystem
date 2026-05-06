using Microsoft.EntityFrameworkCore;
using SalonSystemAPI.Models;

namespace SalonSystemAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Users> Users { get; set; }
        public DbSet<Organization> Organizations { get; set; }
        public DbSet<OrganizationMembers> OrganizationMembers { get; set; }
        public DbSet<Branch> Branches { get; set; }
        public DbSet<Bookings> Bookings { get; set; }
        public DbSet<ServiceType> ServiceTypes { get; set; }
        public DbSet<StaffQuota> StaffQuotas { get; set; }
        public DbSet<Client> Clients { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Users>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Users>()
                .Property(u => u.DateCreated)
                .HasDefaultValueSql("NOW()");

            // Speeds up staff overlap queries
            modelBuilder.Entity<Bookings>()
                .HasIndex(b => new { b.StaffUserId, b.StartTime, b.EndTime });

            modelBuilder.Entity<Bookings>()
                .HasIndex(b => new { b.OrganizationId, b.BranchId, b.StartTime });

            modelBuilder.Entity<Bookings>()
                .HasIndex(b => b.BookingReference)
                .IsUnique();

            // Speeds up service lookups per org
            modelBuilder.Entity<ServiceType>()
                .HasIndex(s => new { s.OrganizationId, s.IsActive });

            // Quota lookups by org + period
            modelBuilder.Entity<StaffQuota>()
                .HasIndex(q => new { q.OrganizationId, q.IsActive, q.StartDate, q.EndDate });

            modelBuilder.Entity<StaffQuota>()
                .HasIndex(q => new { q.UserId, q.OrganizationId, q.IsActive });

            modelBuilder.Entity<Client>()
                .HasIndex(c => new { c.OrganizationId, c.IsActive });

            modelBuilder.Entity<Client>()
                .HasIndex(c => new { c.OrganizationId, c.ApprovalStatus });

            // Staff lookups by org (e.g. member list, role filter)
            modelBuilder.Entity<OrganizationMembers>()
                .HasIndex(m => new { m.OrganizationId, m.Role });

            // Membership existence checks (user joining org)
            modelBuilder.Entity<OrganizationMembers>()
                .HasIndex(m => new { m.UserId, m.OrganizationId });

            // Dashboard status counts (Status + IsActive filtered per org)
            modelBuilder.Entity<Bookings>()
                .HasIndex(b => new { b.OrganizationId, b.Status, b.IsActive });

            // Member booking history lookups
            modelBuilder.Entity<Bookings>()
                .HasIndex(b => b.CustomerId);

            // Branch dropdowns filtered by org + active
            modelBuilder.Entity<Branch>()
                .HasIndex(br => new { br.OrganizationId, br.IsActive });
        }
    }
}
