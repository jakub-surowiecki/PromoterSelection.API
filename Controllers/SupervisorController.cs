using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromoterSelection.API.DTOs;
using PromoterSelection.API.Services;

namespace PromoterSelection.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SupervisorController : ControllerBase
{
    private readonly ISupervisorService _supervisorService;

    public SupervisorController(ISupervisorService supervisorService)
    {
        _supervisorService = supervisorService;
    }

    [HttpGet("assignments")]
    [Authorize(Roles = "Supervisor")]
    public async Task<ActionResult<IEnumerable<AssignmentDto>>> GetSupervisorAssignments()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdString, out int supervisorId))
            return Unauthorized();

        var assignments = await _supervisorService.GetSupervisorAssignmentsAsync(supervisorId);
        return Ok(assignments);
    }

    [HttpGet("process-info")]
    [Authorize(Roles = "Supervisor")]
    public async Task<ActionResult<ProcessDescriptionDto>> GetProcessDescription()
    {
        var processInfo = await _supervisorService.GetProcessDescriptionAsync();
        return Ok(processInfo);
    }
}