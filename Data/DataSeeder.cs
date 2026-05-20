using PromoterSelection.API.Models;

namespace PromoterSelection.API.Data;

public static class DataSeeder
{
    public static void Seed(AppDbContext context)
    {
        if (context.Users.Any()) return;

        // Admin
        context.Users.Add(new User
        {
            Email = "admin@university.edu",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
            Role = UserRole.Admin,
            FirstName = "Jan",
            LastName = "Kowalski"
        });

        // Supervisors
        var supervisors = new[]
        {
            new User { Email = "prof.nowak@university.edu", PasswordHash = BCrypt.Net.BCrypt.HashPassword("pass123"), Role = UserRole.Supervisor, FirstName = "Andrzej", LastName = "Nowak", Title = "Prof. dr hab.", MaxStudents = 5 },
            new User { Email = "dr.wisniewska@university.edu", PasswordHash = BCrypt.Net.BCrypt.HashPassword("pass123"), Role = UserRole.Supervisor, FirstName = "Anna", LastName = "Wiśniewska", Title = "Dr inż.", MaxStudents = 4 },
            new User { Email = "dr.maj@university.edu", PasswordHash = BCrypt.Net.BCrypt.HashPassword("pass123"), Role = UserRole.Supervisor, FirstName = "Tomasz", LastName = "Maj", Title = "Dr", MaxStudents = 6 },
            new User { Email = "prof.kowal@university.edu", PasswordHash = BCrypt.Net.BCrypt.HashPassword("pass123"), Role = UserRole.Supervisor, FirstName = "Maria", LastName = "Kowal", Title = "Prof. dr hab.", MaxStudents = 3 },
        };
        context.Users.AddRange(supervisors);

        // Students
        var students = new[]
        {
            new User { Email = "student1@student.edu", PasswordHash = BCrypt.Net.BCrypt.HashPassword("pass123"), Role = UserRole.Student, FirstName = "Piotr", LastName = "Zając", AlbumNumber = "123456", GPA = 4.8, IsGPAConfirmed = true },
            new User { Email = "student2@student.edu", PasswordHash = BCrypt.Net.BCrypt.HashPassword("pass123"), Role = UserRole.Student, FirstName = "Katarzyna", LastName = "Lewandowska", AlbumNumber = "123457", GPA = 4.5, IsGPAConfirmed = true },
            new User { Email = "student3@student.edu", PasswordHash = BCrypt.Net.BCrypt.HashPassword("pass123"), Role = UserRole.Student, FirstName = "Marek", LastName = "Wróbel", AlbumNumber = "123458", GPA = 4.2, IsGPAConfirmed = false },
            new User { Email = "student4@student.edu", PasswordHash = BCrypt.Net.BCrypt.HashPassword("pass123"), Role = UserRole.Student, FirstName = "Agnieszka", LastName = "Dąbrowska", AlbumNumber = "123459", GPA = 3.9, IsGPAConfirmed = true },
            new User { Email = "student5@student.edu", PasswordHash = BCrypt.Net.BCrypt.HashPassword("pass123"), Role = UserRole.Student, FirstName = "Łukasz", LastName = "Jankowski", AlbumNumber = "123460", GPA = 4.7, IsGPAConfirmed = true },
        };
        context.Users.AddRange(students);

        // Schedule
        context.Schedules.Add(new Schedule
        {
            StartDate = DateTime.UtcNow.AddDays(-5),
            EndDate = DateTime.UtcNow.AddDays(25),
            IsActive = true
        });

        context.SaveChanges();
    }
}
