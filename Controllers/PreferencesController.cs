using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PromoterSelection.API.Data;
using PromoterSelection.API.DTOs;
using PromoterSelection.API.Models;

namespace PromoterSelection.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Student")]
public class PreferencesController : ControllerBase
{
    private readonly AppDbContext _db;

    public PreferencesController(AppDbContext db)
    {
        _db = db;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost]
    public async Task<IActionResult> SetPreferences([FromBody] SetPreferencesRequest req)
    {
        // 1. Sprawdzenie harmonogramu
        var schedule = await _db.Schedules.FirstOrDefaultAsync(s => s.IsActive);
        if (schedule == null)
            return BadRequest(new { message = "Brak aktywnego harmonogramu. Zapisy są zamknięte." });

        var now = DateTime.UtcNow;
        if (now < schedule.StartDate || now > schedule.EndDate)
            return BadRequest(new { message = "Zapisy nie są w tym momencie otwarte." });

        // 2. Walidacja: czy student wybiera dokładnie 3 promotorów (zgodnie z wymaganiami)
        if (req.Preferences.Count != 3)
            return BadRequest(new { message = "Musisz wybrać dokładnie 3 preferowanych promotorów." });

        // Usunięcie starych preferencji studenta
        var existing = await _db.Preferences.Where(p => p.StudentId == CurrentUserId).ToListAsync();
        _db.Preferences.RemoveRange(existing);

        // Dodanie nowych preferencji
        foreach (var pref in req.Preferences)
        {
            _db.Preferences.Add(new Preference
            {
                StudentId = CurrentUserId,
                SupervisorId = pref.SupervisorId,
                Priority = pref.Priority
            });
        }

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyPreferences()
    {
        // 1. Najpierw pobieramy dane z bazy (tylko to, co EF Core umie przetłumaczyć na SQL)
        var prefs = await _db.Preferences
            .Include(p => p.Supervisor)
            .Where(p => p.StudentId == CurrentUserId)
            .OrderBy(p => p.Priority)
            .ToListAsync(); // <-- Tutaj uderzamy do bazy

        // 2. Mapujemy na DTO już w pamięci C# (Client-side evaluation)
        var result = prefs.Select(p => new PreferenceDto(
            p.Id,
            p.SupervisorId,
            $"{p.Supervisor.FirstName} {p.Supervisor.LastName}".Trim(),
            p.Supervisor.Title ?? "",
            p.Priority,
            p.Supervisor.MaxStudents ?? 0
        )).ToList();

        return Ok(result);
    }
}