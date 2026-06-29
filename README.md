# Platform Radar — AI-powered Tech Health Scanner

> Scan een Java/Spring + Angular GitHub-repo en ontvang AI-advies over risico's, upgrade-pad en portfolio-score.

---

## Screenshots

### Dashboard
```
Project Health Score: 72/100
┌──────────────────────────────────────────────────┐
│  Risico's gevonden:                              │
│  [HIGH]   Spring Boot 3.4 nadert EOL             │
│  [MEDIUM] Angular gebruikt nog Zone.js           │
│  [MEDIUM] Geen OpenTelemetry geconfigureerd      │
│  [LOW]    Dockerfile draait als root             │
└──────────────────────────────────────────────────┘

Aanbevolen acties:
  1. Upgrade naar Spring Boot 3.5
  2. Migreer Angular naar Zoneless + Signals
  3. Voeg Dependabot toe
  4. Configureer OpenTelemetry tracing
```

### AI Advies
```
Portfolio Score: B
"Dit project toont enterprise-kennis maar mist moderne
observability en Angular performance-optimalisaties."

Quick Wins (<2 uur):
  [HIGH]   Upgrade Spring Boot parent in pom.xml
  [MEDIUM] Voeg provideExperimentalZonelessChangeDetection toe

Upgrade Pad:
  [HIGH]   Migreer Java 17 → Java 21 (Virtual Threads)
  [MEDIUM] Implementeer OpenTelemetry distributed tracing
```

---

## Stack

| Laag        | Technologie                          |
|-------------|--------------------------------------|
| Backend     | Java 21, Spring Boot 4.1, Spring AI  |
| AI          | OpenAI GPT-4o via Spring AI          |
| Database    | PostgreSQL 16 + Flyway migrations    |
| Frontend    | Angular 22, Signals, Material        |
| Observability | OpenTelemetry + Jaeger             |
| CI/CD       | GitHub Actions + Dependabot          |
| Container   | Docker Compose, multi-stage builds   |

---

## Lokaal draaien

### Vereisten
- Java 21+
- Node 22+
- Docker & Docker Compose
- OpenAI API key (of een compatibele API)

### Met Docker Compose

```bash
# Kopieer en vul in
cp .env.example .env
# Vul OPENAI_API_KEY en optioneel GITHUB_TOKEN in

docker compose up --build
```

Vervolgens:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8080/api
- **Jaeger tracing**: http://localhost:16686

### Lokale ontwikkeling

**Backend:**
```bash
cd backend
./mvnw spring-boot:run \
  -Dspring-boot.run.profiles=dev \
  -DOPENAI_API_KEY=your-key \
  -DGITHUB_TOKEN=your-token
```

**Frontend:**
```bash
cd frontend
npm install
npm start   # proxy naar localhost:8080
```

---

## API Endpoints

| Method | Endpoint                    | Beschrijving                    |
|--------|-----------------------------|---------------------------------|
| POST   | `/api/scans`               | Start een nieuwe scan           |
| GET    | `/api/scans`               | Alle scans ophalen              |
| GET    | `/api/scans/{id}`          | Scan detail met findings        |
| GET    | `/api/scans/{id}/advice`   | AI-advies genereren             |
| GET    | `/api/scans/{id}/report.md` | Markdown rapport downloaden    |

### Voorbeeld: scan starten

```bash
curl -X POST http://localhost:8080/api/scans \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/spring-projects/spring-boot",
    "branch": "main"
  }'
```

---

## Wat wordt gescand?

| Categorie     | Details                                              |
|---------------|------------------------------------------------------|
| Backend       | Java versie, Spring Boot versie, EOL-status          |
| Security      | Spring Security configuratie, Dockerfile non-root    |
| Frontend      | Angular versie, Zone.js, Signals-gebruik             |
| DevOps        | Dockerfile aanwezig, GitHub Actions pipeline         |
| Observability | OpenTelemetry / Micrometer tracing                   |
| Dependencies  | Dependabot / OWASP security scanning                 |

---

## Database schema

```sql
CREATE TABLE scan (
    id                      UUID PRIMARY KEY,
    repo_name               VARCHAR(255),
    health_score            INTEGER,          -- 0-100
    status                  VARCHAR(20),      -- PENDING/SCANNING/COMPLETED/FAILED
    java_version            VARCHAR(20),
    spring_boot_version     VARCHAR(20),
    angular_version         VARCHAR(20),
    ...
);

CREATE TABLE scan_finding (
    id              UUID PRIMARY KEY,
    scan_id         UUID REFERENCES scan(id),
    category        VARCHAR(30),   -- BACKEND/FRONTEND/SECURITY/DEVOPS/...
    severity        VARCHAR(10),   -- HIGH/MEDIUM/LOW/INFO
    title           VARCHAR(255),
    description     TEXT,
    recommendation  TEXT
);
```

---

## Architectuur

```
┌─────────────────┐    ┌──────────────────────────────────┐
│   Angular 19    │    │         Spring Boot 3.5          │
│   (Signals)     │◄──►│                                  │
│   (Zoneless)    │    │  ScanController                  │
└─────────────────┘    │  ├── ScanService                 │
                        │  │   ├── RepoScannerService      │
                        │  │   │   └── GitHub API client   │
                        │  │   └── AiAdviceService         │
                        │  │       └── Spring AI (OpenAI)  │
                        │  └── ScanRepository (JPA)        │
                        │                                  │
                        └────────────┬─────────────────────┘
                                     │
                              ┌──────▼──────┐
                              │ PostgreSQL   │
                              │ + Flyway    │
                              └─────────────┘
```

---

## Waarom dit portfolio-materiaal is

Dit project demonstreert:

- **Java modernisering**: Java 21 Records, Virtual Threads, Pattern Matching
- **Spring Boot expertise**: Spring AI integratie, Spring Security, JPA
- **Angular modernisering**: Signals, Zoneless, Standalone Components, OnPush
- **DevOps**: multi-stage Docker, GitHub Actions, OWASP scanning, Dependabot
- **Observability**: OpenTelemetry distributed tracing, Micrometer metrics
- **Architectuur**: async scanning pipeline, polling-based status updates
- **AI-integratie**: Spring AI ChatClient met structured prompts

---

## Licentie

MIT
