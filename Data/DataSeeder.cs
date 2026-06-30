using Microsoft.EntityFrameworkCore;
using PromoterSelection.API.Data;
using PromoterSelection.API.Models;
using PromoterSelection.API.Services;

namespace PromoterSelection.API;

public static class DataSeeder
{
    public static async Task SeedDataAsync(AppDbContext context, IAuthService authService)
    {
        if (await context.Users.AnyAsync()) return;

        // --- KONTO ADMINISTRATORA ---
        var admin = new User
        {
            Email = "admin@university.edu",
            PasswordHash = authService.HashPassword("admin123"),
            FirstName = "Jan",
            LastName = "Kowalski",
            Role = UserRole.Admin
        };
        context.Users.Add(admin);

        // --- KADRA DYDAKTYCZNA (PROMOTORZY) ---
        var supervisors = new List<User>
        {
            new User { Email = "a.nowak@university.edu", PasswordHash = authService.HashPassword("pass123"), FirstName = "Andrzej", LastName = "Nowak", Role = UserRole.Supervisor, Title = "Prof. dr hab.", MaxStudents = 15 },
            new User { Email = "m.kowalska@university.edu", PasswordHash = authService.HashPassword("pass123"), FirstName = "Maria", LastName = "Kowalska", Role = UserRole.Supervisor, Title = "Dr inż.", MaxStudents = 12 },
            new User { Email = "t.wisniewski@university.edu", PasswordHash = authService.HashPassword("pass123"), FirstName = "Tomasz", LastName = "Wiśniewski", Role = UserRole.Supervisor, Title = "Dr", MaxStudents = 10 },
            new User { Email = "k.zielinska@university.edu", PasswordHash = authService.HashPassword("pass123"), FirstName = "Katarzyna", LastName = "Zielińska", Role = UserRole.Supervisor, Title = "Prof. uczelni", MaxStudents = 8 },
            new User { Email = "j.wojcik@university.edu", PasswordHash = authService.HashPassword("pass123"), FirstName = "Jerzy", LastName = "Wójcik", Role = UserRole.Supervisor, Title = "Dr inż.", MaxStudents = 12 },
            new User { Email = "p.kaminski@university.edu", PasswordHash = authService.HashPassword("pass123"), FirstName = "Piotr", LastName = "Kamiński", Role = UserRole.Supervisor, Title = "Dr hab. inż.", MaxStudents = 10 },
            new User { Email = "a.lewandowska@university.edu", PasswordHash = authService.HashPassword("pass123"), FirstName = "Anna", LastName = "Lewandowska", Role = UserRole.Supervisor, Title = "Dr", MaxStudents = 15 },
            new User { Email = "m.szymanski@university.edu", PasswordHash = authService.HashPassword("pass123"), FirstName = "Michał", LastName = "Szymański", Role = UserRole.Supervisor, Title = "Mgr inż.", MaxStudents = 8 },
            new User { Email = "e.dabrowska@university.edu", PasswordHash = authService.HashPassword("pass123"), FirstName = "Ewa", LastName = "Dąbrowska", Role = UserRole.Supervisor, Title = "Dr inż.", MaxStudents = 10 },
            new User { Email = "k.kozak@university.edu", PasswordHash = authService.HashPassword("pass123"), FirstName = "Krzysztof", LastName = "Kozak", Role = UserRole.Supervisor, Title = "Prof. uczelni", MaxStudents = 12 },
            new User { Email = "m.zawadzki@university.edu", PasswordHash = authService.HashPassword("pass123"), FirstName = "Marek", LastName = "Zawadzki", Role = UserRole.Supervisor, Title = "Dr", MaxStudents = 14 },
            new User { Email = "j.duda@university.edu", PasswordHash = authService.HashPassword("pass123"), FirstName = "Joanna", LastName = "Duda", Role = UserRole.Supervisor, Title = "Dr hab.", MaxStudents = 10 }
        };
        context.Users.AddRange(supervisors);
        await context.SaveChangesAsync();

        // --- BAZA TEMATÓW (PO 3 TEMATY NA PROMOTORA) ---
        var topics = new List<ThesisTopic>
        {
            // Prof. Nowak (AI / Machine Learning)
            new ThesisTopic { SupervisorId = supervisors[0].Id, Title = "Wykrywanie anomalii w ruchu sieciowym przy użyciu głębokich sieci neuronowych", Description = "Projekt wymaga znajomości PyTorch oraz analizy pakietów TCP/IP.", CreatedAt = DateTime.UtcNow },
            new ThesisTopic { SupervisorId = supervisors[0].Id, Title = "Generowanie fotorealistycznych twarzy za pomocą modeli dyfuzyjnych", Description = "Implementacja własnego modelu generatywnego opartego na Stable Diffusion.", CreatedAt = DateTime.UtcNow },
            new ThesisTopic { SupervisorId = supervisors[0].Id, Title = "Predykcja szeregów czasowych na rynkach finansowych", Description = "Wykorzystanie architektury Transformer do analizy danych giełdowych.", CreatedAt = DateTime.UtcNow },

            // Dr inż. Kowalska (Cloud Computing / DevOps)
            new ThesisTopic { SupervisorId = supervisors[1].Id, Title = "Projektowanie architektury Serverless na platformie AWS", Description = "Optymalizacja kosztów i wydajności w architekturze opartej o AWS Lambda i DynamoDB.", CreatedAt = DateTime.UtcNow },
            new ThesisTopic { SupervisorId = supervisors[1].Id, Title = "Automatyzacja potoków CI/CD z wykorzystaniem Kubernetes i Helm", Description = "Budowa platformy wdrożeniowej dla architektury mikrousługowej.", CreatedAt = DateTime.UtcNow },
            new ThesisTopic { SupervisorId = supervisors[1].Id, Title = "Rozproszone systemy przechowywania danych w architekturze chmurowej", Description = "Analiza porównawcza systemów Cassandra, MongoDB i Redis pod dużym obciążeniem.", CreatedAt = DateTime.UtcNow },

            // Dr Wiśniewski (Web Development)
            new ThesisTopic { SupervisorId = supervisors[2].Id, Title = "Zastosowanie frameworka Next.js w systemach e-commerce", Description = "Stworzenie skalowalnego sklepu internetowego SSR z obsługą płatności.", CreatedAt = DateTime.UtcNow },
            new ThesisTopic { SupervisorId = supervisors[2].Id, Title = "Porównanie wydajności WebAssembly z tradycyjnym kodem JavaScript", Description = "Implementacja złożonych algorytmów w C++/Rust kompilowanych do przeglądarki.", CreatedAt = DateTime.UtcNow },
            new ThesisTopic { SupervisorId = supervisors[2].Id, Title = "Bezpieczeństwo aplikacji klasy Single Page Application", Description = "Analiza podatności XSS i CSRF we współczesnych aplikacjach React/Vue.", CreatedAt = DateTime.UtcNow },

            // Prof. uczelni Zielińska (Inżynieria Oprogramowania / Architektura)
            new ThesisTopic { SupervisorId = supervisors[3].Id, Title = "Wzorce projektowe w architekturze Clean Architecture", Description = "Aplikacja systemu bankowego w .NET z izolacją domeny biznesowej.", CreatedAt = DateTime.UtcNow },
            new ThesisTopic { SupervisorId = supervisors[3].Id, Title = "Wpływ Test-Driven Development na jakość kodu", Description = "Eksperymentalne porównanie metryk jakościowych oprogramowania.", CreatedAt = DateTime.UtcNow },
            new ThesisTopic { SupervisorId = supervisors[3].Id, Title = "Zastosowanie Domain-Driven Design w dużych systemach logistycznych", Description = "Modelowanie skomplikowanych reguł biznesowych z użyciem CQRS.", CreatedAt = DateTime.UtcNow },

            // Dr inż. Wójcik (Cybersecurity)
            new ThesisTopic { SupervisorId = supervisors[4].Id, Title = "Analiza malware z wykorzystaniem inżynierii wstecznej", Description = "Dekompilacja i analiza zachowań współczesnych wirusów klasy Ransomware.", CreatedAt = DateTime.UtcNow },
            new ThesisTopic { SupervisorId = supervisors[4].Id, Title = "System wykrywania intruzów (IDS) bazujący na uczeniu maszynowym", Description = "Zastosowanie klasyfikatorów SVM i Random Forest w cyberbezpieczeństwie.", CreatedAt = DateTime.UtcNow },
            new ThesisTopic { SupervisorId = supervisors[4].Id, Title = "Zabezpieczenia w protokołach IoT dla inteligentnych domów", Description = "Audyt bezpieczeństwa rozwiązań bazujących na MQTT i ZigBee.", CreatedAt = DateTime.UtcNow },

            // Dr hab. inż. Kamiński (Embedded Systems / IoT)
            new ThesisTopic { SupervisorId = supervisors[5].Id, Title = "System nawigacji autonomicznego drona", Description = "Programowanie systemów wbudowanych z wykorzystaniem ROS (Robot Operating System).", CreatedAt = DateTime.UtcNow },
            new ThesisTopic { SupervisorId = supervisors[5].Id, Title = "Rozproszona sieć czujników jakości powietrza", Description = "Budowa systemu opartego na mikrokontrolerach ESP32 i architekturze Mesh.", CreatedAt = DateTime.UtcNow },
            new ThesisTopic { SupervisorId = supervisors[5].Id, Title = "Zastosowanie algorytmów RTOS w systemach krytycznych", Description = "Implementacja systemu operacyjnego czasu rzeczywistego w pojazdach ratunkowych.", CreatedAt = DateTime.UtcNow },

            // Dr Lewandowska (Data Science / Big Data)
            new ThesisTopic { SupervisorId = supervisors[6].Id, Title = "Analiza sentymentu w mediach społecznościowych", Description = "Wykorzystanie NLP do przewidywania wyników wyborów politycznych na podstawie postów X/Twitter.", CreatedAt = DateTime.UtcNow },
            new ThesisTopic { SupervisorId = supervisors[6].Id, Title = "Budowa silnika rekomendacyjnego dla platform streamingowych", Description = "Przetwarzanie rozproszone gigabajtów danych użytkowników za pomocą Apache Spark.", CreatedAt = DateTime.UtcNow },
            new ThesisTopic { SupervisorId = supervisors[6].Id, Title = "Wykrywanie nadużyć finansowych (Fraud Detection)", Description = "Zastosowanie grafowych sieci neuronowych do śledzenia transakcji.", CreatedAt = DateTime.UtcNow },

            // Mgr inż. Szymański (Game Development / VR)
            new ThesisTopic { SupervisorId = supervisors[7].Id, Title = "Generowanie proceduralne terenu w silniku Unreal Engine 5", Description = "Zastosowanie szumu Perlina i algorytmów wokselowych w projektowaniu światów 3D.", CreatedAt = DateTime.UtcNow },
            new ThesisTopic { SupervisorId = supervisors[7].Id, Title = "Optymalizacja renderowania środowisk VR", Description = "Projekt badawczy celujący w poprawę FPS bez widocznej straty jakości obrazu.", CreatedAt = DateTime.UtcNow },
            new ThesisTopic { SupervisorId = supervisors[7].Id, Title = "Systemy sztucznej inteligencji NPC w grach RPG", Description = "Implementacja algorytmów drzew zachowań (Behavior Trees) i nawigacji przestrzennej.", CreatedAt = DateTime.UtcNow },

            // Pozostałym dodajmy domyślne generyczne
            new ThesisTopic { SupervisorId = supervisors[8].Id, Title = "Zarządzanie stanem w aplikacjach mobilnych Flutter", Description = "Analiza wzorców BLoC, Riverpod i Provider.", CreatedAt = DateTime.UtcNow },
            new ThesisTopic { SupervisorId = supervisors[8].Id, Title = "Natywne moduły C++ dla aplikacji React Native", Description = "Tworzenie wydajnych rozwiązań na platformy mobilne.", CreatedAt = DateTime.UtcNow },
            new ThesisTopic { SupervisorId = supervisors[8].Id, Title = "Dostępność (Accessibility) w aplikacjach wieloplatformowych", Description = "Projekt systemu dostosowanego do osób niedowidzących.", CreatedAt = DateTime.UtcNow },

            new ThesisTopic { SupervisorId = supervisors[9].Id, Title = "Kryptografia postkwantowa", Description = "Implementacja i analiza wydajności podpisów cyfrowych odpornych na komputery kwantowe.", CreatedAt = DateTime.UtcNow },
            new ThesisTopic { SupervisorId = supervisors[9].Id, Title = "Technologia Blockchain w sektorze publicznym", Description = "Projekt systemu transparentnych głosowań online opartych na smart kontraktach (Solidity).", CreatedAt = DateTime.UtcNow },
            new ThesisTopic { SupervisorId = supervisors[9].Id, Title = "Zabezpieczenia sprzętowe typu TPM", Description = "Analiza ochrony kluczy kryptograficznych w nowoczesnych płytach głównych.", CreatedAt = DateTime.UtcNow },

            new ThesisTopic { SupervisorId = supervisors[10].Id, Title = "Interfejsy mózg-komputer (BCI)", Description = "Przetwarzanie sygnałów EEG do sterowania protezami.", CreatedAt = DateTime.UtcNow },
            new ThesisTopic { SupervisorId = supervisors[10].Id, Title = "Analiza obrazów USG z użyciem sieci konwolucyjnych", Description = "Projekt wspierany przez lokalne szpitale w celu szybkiej diagnostyki narządów.", CreatedAt = DateTime.UtcNow },
            new ThesisTopic { SupervisorId = supervisors[10].Id, Title = "Przetwarzanie języka naturalnego w dokumentacji medycznej", Description = "Ekstrakcja kluczowych informacji z tekstowych wywiadów lekarskich.", CreatedAt = DateTime.UtcNow },

            new ThesisTopic { SupervisorId = supervisors[11].Id, Title = "Zwinne zarządzanie projektami w organizacjach rozproszonych", Description = "Projekt aplikacji wspierającej metryki Scrum w trybie pracy w pełni zdalnej.", CreatedAt = DateTime.UtcNow },
            new ThesisTopic { SupervisorId = supervisors[11].Id, Title = "Szacowanie kosztów oprogramowania metodą punktów funkcyjnych", Description = "System wspomagający pracę analityków biznesowych.", CreatedAt = DateTime.UtcNow },
            new ThesisTopic { SupervisorId = supervisors[11].Id, Title = "Integracja systemów ERP z hurtowniami danych", Description = "Projekt hurtowni w technologii Microsoft SQL Server Analysis Services.", CreatedAt = DateTime.UtcNow }
        };
        context.ThesisTopics.AddRange(topics);

        // --- GENEROWANIE STUDENTÓW ---
        var students = new List<User>();

        var firstNamesMale = new[] { "Piotr", "Michał", "Jakub", "Kamil", "Kacper", "Bartosz", "Dawid", "Maciej", "Szymon", "Patryk", "Jan", "Tomasz", "Krzysztof", "Marcin", "Mateusz", "Łukasz", "Paweł", "Karol", "Adam", "Hubert" };
        var firstNamesFemale = new[] { "Anna", "Karolina", "Magdalena", "Natalia", "Zuzanna", "Aleksandra", "Julia", "Weronika", "Oliwia", "Alicja", "Katarzyna", "Marta", "Agnieszka", "Paulina", "Klaudia", "Monika", "Patrycja", "Dominika", "Wiktoria", "Ewelina" };
        var lastNames = new[] { "Nowak", "Kowalski", "Wiśniewski", "Wójcik", "Kowalczyk", "Kamiński", "Lewandowski", "Zieliński", "Szymański", "Woźniak", "Dąbrowski", "Kozłowski", "Jankowski", "Mazur", "Wojciechowski", "Kwiatkowski", "Kaczmarek", "Piotrowski", "Grabowski", "Zając", "Pawłowski", "Michalski", "Nowicki", "Adamczyk", "Dudek", "Wieczorek", "Majewski", "Krupa", "Stępień", "Duda" };

        var random = new Random(2026); // Stały seed dla deterministycznego układu

        for (int i = 0; i < 120; i++)
        {
            bool isMale = random.Next(0, 2) == 0;
            string firstName = isMale
                ? firstNamesMale[random.Next(firstNamesMale.Length)]
                : firstNamesFemale[random.Next(firstNamesFemale.Length)];

            string lastName = lastNames[random.Next(lastNames.Length)];
            if (!isMale && lastName.EndsWith("i"))
            {
                lastName = lastName.Substring(0, lastName.Length - 1) + "a";
            }

            students.Add(new User
            {
                Email = $"student{i + 1}@student.edu",
                PasswordHash = authService.HashPassword("student123"),
                FirstName = firstName,
                LastName = lastName,
                Role = UserRole.Student,
                AlbumNumber = (120000 + i).ToString(),
                GPA = Math.Round(random.NextDouble() * (5.0 - 3.2) + 3.2, 2),
                IsGPAConfirmed = random.Next(0, 100) < 85
            });
        }
        context.Users.AddRange(students);
        await context.SaveChangesAsync();

        // --- GENEROWANIE ZESPOŁÓW PROJEKTOWYCH ---
        var teamPrefixes = new[] { "Alpha", "Beta", "Gamma", "Delta", "Omega", "Cyber", "Tech", "Data", "Cloud", "Web", "AI", "Smart", "Dev", "Net", "Code" };
        var teamSuffixes = new[] { "Squad", "Team", "Crew", "Force", "Unit", "Labs", "Minds", "Group", "Engineers" };

        var teams = new List<Team>();
        for (int i = 0; i < 25; i++)
        {
            string tName = $"{teamPrefixes[random.Next(teamPrefixes.Length)]} {teamSuffixes[random.Next(teamSuffixes.Length)]}";
            teams.Add(new Team { Name = tName });
        }
        context.Teams.AddRange(teams);
        await context.SaveChangesAsync();

        // --- PRZYPISANIE STUDENTÓW DO ZESPOŁÓW ---
        for (int i = 0; i < 75; i++)
        {
            int teamIndex = i / 3;
            students[i].TeamId = teams[teamIndex].Id;
        }

        await context.SaveChangesAsync();
    }
}