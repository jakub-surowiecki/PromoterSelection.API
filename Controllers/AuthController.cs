using Microsoft.AspNetCore.Mvc;
using PromoterSelection.API.DTOs;
using PromoterSelection.API.Services;

namespace PromoterSelection.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth)
    {
        _auth = auth;
    }

    /// <summary>POST /api/auth/login — logowanie użytkownika</summary>
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest req)
    {
        var result = _auth.Login(req.Email, req.Password);
        if (result == null)
            return Unauthorized(new { message = "Nieprawidłowy e-mail lub hasło." });
        return Ok(result);
    }
}
