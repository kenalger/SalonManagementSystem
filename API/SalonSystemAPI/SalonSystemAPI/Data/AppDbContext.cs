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
        public DbSet<Bookings> Bookings { get; set; }
        public DbSet<ServiceType> ServiceTypes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Users>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Users>()
                .Property(u => u.DateCreated)
                .HasDefaultValueSql("NOW()");
        }
    }
}
