using System.Net;
using System.Net.Mail;

namespace PromoterSelection.API.Services;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body);
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendEmailAsync(string to, string subject, string body)
    {
        var host = _config["Smtp:Host"] ?? "sandbox.smtp.mailtrap.io";
        var port = int.TryParse(_config["Smtp:Port"], out var p) ? p : 2525;
        var user = _config["Smtp:Username"] ?? "test";
        var pass = _config["Smtp:Password"] ?? "test";

        using var client = new SmtpClient(host, port)
        {
            Credentials = new NetworkCredential(user, pass),
            EnableSsl = true
        };

        var mailMessage = new MailMessage
        {
            From = new MailAddress("powiadomienia@systemwyboru.pl", "System Wyboru Promotorów"),
            Subject = subject,
            Body = body,
            IsBodyHtml = false,
        };

        mailMessage.To.Add(to);

        try
        {
            await client.SendMailAsync(mailMessage);
            Console.WriteLine($"Wysłano e-mail do: {to}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Błąd wysyłania e-maila do {to}: {ex.Message}");
        }
    }
}