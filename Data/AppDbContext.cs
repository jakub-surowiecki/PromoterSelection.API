using Microsoft.EntityFrameworkCore;
using PromoterSelection.API.Models;

namespace PromoterSelection.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<Preference> Preferences => Set<Preference>();
    public DbSet<Assignment> Assignments => Set<Assignment>();
    public DbSet<Schedule> Schedules => Set<Schedule>();
    public DbSet<ThesisTopic> ThesisTopics => Set<ThesisTopic>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Role).HasConversion<string>();

            entity.HasMany(u => u.Preferences)
                  .WithOne(p => p.Student)
                  .HasForeignKey(p => p.StudentId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(u => u.Assignment)
                  .WithOne(a => a.Student)
                  .HasForeignKey<Assignment>(a => a.StudentId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(u => u.ThesisTopics)
                  .WithOne(t => t.Supervisor)
                  .HasForeignKey(t => t.SupervisorId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(u => u.Team)
                  .WithMany(t => t.Members)
                  .HasForeignKey(u => u.TeamId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Preference>(entity =>
        {
            entity.HasOne(p => p.Supervisor)
                  .WithMany()
                  .HasForeignKey(p => p.SupervisorId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Assignment>(entity =>
        {
            entity.HasOne(a => a.Supervisor)
                  .WithMany()
                  .HasForeignKey(a => a.SupervisorId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
