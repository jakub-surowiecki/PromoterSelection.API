using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PromoterSelection.API.Data;
using PromoterSelection.API.DTOs;
using PromoterSelection.API.Models;

namespace PromoterSelection.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SchedulesController : ControllerBase
{
    private readonly AppDbContext _db;

    public SchedulesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("current")]
    public async Task<IActionResult> GetCurrentSchedule()
    {
        var schedule = await _db.Schedules.FirstOrDefaultAsync(s => s.IsActive);
        if (schedule == null)
            return NotFound(new { message = "Brak aktywnego harmonogramu." });

        var now = DateTime.UtcNow;
        var isOpen = now >= schedule.StartDate && now <= schedule.EndDate;

        return Ok(new ScheduleDto(
            schedule.Id,
            schedule.StartDate,
            schedule.EndDate,
            schedule.IsActive,
            isOpen
        ));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> SetSchedule([FromBody] SetScheduleRequest req)
    {
        // Najpierw deaktywujemy wszystkie dotychczasowe harmonogramy
        var existingSchedules = await _db.Schedules.ToListAsync();
        foreach (var s in existingSchedules)
        {
            s.IsActive = false;
        }

        var newSchedule = new Schedule
        {
            StartDate = req.StartDate.ToUniversalTime(),
            EndDate = req.EndDate.ToUniversalTime(),
            IsActive = req.IsActive
        };

        _db.Schedules.Add(newSchedule);
        await _db.SaveChangesAsync();

        return Ok(new { id = newSchedule.Id });
    }

    [HttpDelete("reset")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ResetSystem()
    {
        // 1. Usuwamy harmonogramy
        var schedules = await _db.Schedules.ToListAsync();
        _db.Schedules.RemoveRange(schedules);

        // 2. Usuwamy przydziały (wyniki algorytmu)
        var assignments = await _db.Assignments.ToListAsync();
        _db.Assignments.RemoveRange(assignments);

        // 3. Resetujemy powiązania zespołów z promotorami
        var teams = await _db.Teams.ToListAsync();
        foreach (var t in teams)
        {
            t.AssignedSupervisorId = null;
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "System został zresetowany." });
    }
}