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
[Authorize]
public class TopicsController : ControllerBase
{
    private readonly AppDbContext _db;

    public TopicsController(AppDbContext db)
    {
        _db = db;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost]
    [Authorize(Roles = "Supervisor")]
    public async Task<IActionResult> CreateTopic([FromBody] CreateTopicRequest req)
    {
        var topic = new ThesisTopic
        {
            SupervisorId = CurrentUserId,
            Title = req.Title,
            Description = req.Description,
            CreatedAt = DateTime.UtcNow
        };

        _db.ThesisTopics.Add(topic);
        await _db.SaveChangesAsync();

        return Ok(new { id = topic.Id });
    }

    [HttpGet]
    public async Task<IActionResult> GetTopics()
    {
        // 1. Wyciągamy dane z bazy i sortujemy (to EF Core umie przetłumaczyć na SQL)
        var topics = await _db.ThesisTopics
            .Include(t => t.Supervisor)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        // 2. Mapujemy na DTO już w pamięci aplikacji (Client-side evaluation), 
        // dzięki czemu możemy dowolnie łączyć stringi
        var result = topics.Select(t => new TopicDto(
            t.Id,
            t.SupervisorId,
            $"{t.Supervisor.Title} {t.Supervisor.FirstName} {t.Supervisor.LastName}".Trim(),
            t.Title,
            t.Description,
            t.CreatedAt
        )).ToList();

        return Ok(result);
    }
}