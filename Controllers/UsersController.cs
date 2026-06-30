using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PromoterSelection.API.Data;
using PromoterSelection.API.DTOs;
using PromoterSelection.API.Models;
using PromoterSelection.API.Services;
using CsvHelper;
using CsvHelper.Configuration;
using System.Globalization;

namespace PromoterSelection.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuthService _auth;

    public UsersController(AppDbContext db, IAuthService auth)
    {
        _db = db;
        _auth = auth;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string CurrentRole => User.FindFirstValue(ClaimTypes.Role)!;

    // ── GET /api/users/students ─────────────────────────────────────────────
    [HttpGet("students")]
    public async Task<IActionResult> GetStudents()
    {
        var assignments = await _db.Assignments.ToDictionaryAsync(a => a.StudentId, a => a.SupervisorId);

        var students = await _db.Users
            .Where(u => u.Role == UserRole.Student)
            .Select(u => new UserDto(
                u.Id, u.Email, u.Role.ToString(), u.FirstName, u.LastName,
                u.AlbumNumber, u.GPA, u.IsGPAConfirmed, u.TeamId,
                u.Title, u.MaxStudents, 0))
            .ToListAsync();

        return Ok(students);
    }

    // ── GET /api/users/supervisors ──────────────────────────────────────────
    [HttpGet("supervisors")]
    public async Task<IActionResult> GetSupervisors()
    {
        var assignedCounts = await _db.Assignments
            .GroupBy(a => a.SupervisorId)
            .Select(g => new { SupervisorId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.SupervisorId, x => x.Count);

        var supervisors = await _db.Users
            .Where(u => u.Role == UserRole.Supervisor)
            .ToListAsync();

        var result = supervisors.Select(u => new UserDto(
            u.Id, u.Email, u.Role.ToString(), u.FirstName, u.LastName,
            u.AlbumNumber, u.GPA, u.IsGPAConfirmed, u.TeamId,
            u.Title, u.MaxStudents,
            assignedCounts.TryGetValue(u.Id, out int c) ? c : 0)).ToList();

        return Ok(result);
    }

    // ── GET /api/users/me ───────────────────────────────────────────────────
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var user = await _db.Users.FindAsync(CurrentUserId);
        if (user == null) return NotFound();

        var assignedCount = await _db.Assignments.CountAsync(a => a.SupervisorId == CurrentUserId);

        return Ok(new UserDto(user.Id, user.Email, user.Role.ToString(), user.FirstName, user.LastName,
            user.AlbumNumber, user.GPA, user.IsGPAConfirmed, user.TeamId,
            user.Title, user.MaxStudents, assignedCount));
    }

    // ── POST /api/users ─────────────────────────────────────────────────────
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest req)
    {
        if (await _db.Users.AnyAsync(u => u.Email == req.Email))
            return BadRequest(new { message = "Użytkownik z tym e-mailem już istnieje." });

        if (!Enum.TryParse<UserRole>(req.Role, true, out var role))
            return BadRequest(new { message = "Nieprawidłowa rola." });

        var user = new User
        {
            Email = req.Email,
            PasswordHash = _auth.HashPassword(req.Password),
            FirstName = req.FirstName,
            LastName = req.LastName,
            Role = role,
            AlbumNumber = req.AlbumNumber,
            GPA = req.GPA,
            Title = req.Title,
            MaxStudents = req.MaxStudents
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetMe), new { id = user.Id }, user.Id);
    }

    // ── PUT /api/users/{id} ─────────────────────────────────────────────────
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest req)
    {
        // Students can only update themselves
        if (CurrentRole != "Admin" && CurrentUserId != id)
            return Forbid();

        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        if (req.FirstName != null) user.FirstName = req.FirstName;
        if (req.LastName != null) user.LastName = req.LastName;
        if (req.Email != null) user.Email = req.Email;
        if (req.AlbumNumber != null) user.AlbumNumber = req.AlbumNumber;
        if (req.Password != null) user.PasswordHash = _auth.HashPassword(req.Password);
        if (req.GPA.HasValue) user.GPA = req.GPA;
        if (req.IsGPAConfirmed.HasValue) user.IsGPAConfirmed = req.IsGPAConfirmed.Value;
        if (req.Title != null) user.Title = req.Title;
        if (req.MaxStudents.HasValue && CurrentRole == "Admin") user.MaxStudents = req.MaxStudents;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── DELETE /api/users/{id} ──────────────────────────────────────────────
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── POST /api/users/import/students ─────────────────────────────────────
    [HttpPost("import/students")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ImportStudents(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Brak pliku." });

        var imported = 0;
        var errors = new List<string>();

        using var reader = new StreamReader(file.OpenReadStream());
        using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true,
            MissingFieldFound = null
        });

        var records = csv.GetRecords<CsvStudentRow>().ToList();

        foreach (var row in records)
        {
            if (await _db.Users.AnyAsync(u => u.Email == row.Email))
            {
                errors.Add($"Pominięto {row.Email} — już istnieje.");
                continue;
            }

            _db.Users.Add(new User
            {
                Email = row.Email,
                PasswordHash = _auth.HashPassword(!string.IsNullOrWhiteSpace(row.Password) ? row.Password : "student123"),
                Role = UserRole.Student,
                FirstName = row.FirstName,
                LastName = row.LastName,
                AlbumNumber = row.AlbumNumber,
                GPA = row.GPA
            });
            imported++;
        }

        await _db.SaveChangesAsync();
        return Ok(new { imported, errors });
    }

    // ── PUT /api/users/me/gpa ───────────────────────────────────────────────
    [HttpPut("me/gpa")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> ConfirmGpa([FromBody] ConfirmGpaRequest req)
    {
        var user = await _db.Users.FindAsync(CurrentUserId);
        if (user == null) return NotFound();

        user.GPA = req.GPA;
        user.IsGPAConfirmed = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record ConfirmGpaRequest(double GPA);
