# medication-service

Backend service for the **Smart Medication Tracker** feature of ChronicCare Pro: medication schedules, dose logging, and adherence tracking.

Built with [NestJS](https://nestjs.com/) (TypeScript, ES modules) and [PostgreSQL](https://www.postgresql.org/) via [Kysely](https://kysely.dev/), tested with [Vitest](https://vitest.dev/), linted with [oxlint](https://oxc.rs/).

## Requirements

- Node.js 24+
- npm 11+
- Docker (for PostgreSQL; optional, see below)

## Getting started

```bash
# From the repository root: start PostgreSQL
docker compose up -d

cd services/medication-service
cp .env.example .env
npm install
npm run start:dev
```

The service listens on port `3001` by default (override with `PORT`).

## Storage

| `DATABASE_URL` | Storage used |
|---|---|
| Set | PostgreSQL. Pending migrations are applied automatically on start-up. |
| Not set | In memory. Handy for a quick try without Docker; data is lost on restart and a warning is logged. |

Migrations live in [src/database/migrations/](src/database/migrations/) and are registered in its `index.ts`. Never edit a migration that has already been applied; add a new one instead. See [ADR 0002](../../docs/architecture/adr/0002-database.md) for why PostgreSQL and Kysely were chosen.

```bash
curl http://localhost:3001/health
# {"status":"ok","service":"medication-service","uptimeSeconds":3,"timestamp":"..."}
```

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness check (unversioned, for load balancers and Docker) |
| `POST` | `/api/v1/patients/:patientId/medications` | Add a medication |
| `GET` | `/api/v1/patients/:patientId/medications` | List a patient's medications, sorted by name |
| `GET` | `/api/v1/patients/:patientId/medications/:id` | Get one medication |
| `PATCH` | `/api/v1/patients/:patientId/medications/:id` | Update some fields of a medication |
| `DELETE` | `/api/v1/patients/:patientId/medications/:id` | Remove a medication |

All feature endpoints live under the versioned prefix `/api/v1`. Patient and medication ids are UUIDs. The patient id is in the URL for now; it will come from the logged-in user once `auth-service` exists.

### Medication fields

| Field | Type | Rules |
|---|---|---|
| `name` | string | Required, max 100 characters |
| `dosage` | string | Required, max 50 characters, e.g. `"500 mg"` |
| `timesOfDay` | string[] | Required, 1 to 12 unique times in 24h `HH:mm` format; stored sorted |
| `instructions` | string | Optional, max 500 characters |
| `startDate` | string | Required, `YYYY-MM-DD` |
| `endDate` | string or null | Optional, `YYYY-MM-DD`, not before `startDate`; `null` means ongoing |

Unknown fields are rejected with `400 Bad Request`. The date range and the number of dose times are also enforced by database constraints.

```bash
curl -X POST http://localhost:3001/api/v1/patients/5f0c7a1e-8a51-4a8e-9a4b-1f7c3a2b9d01/medications \
  -H 'Content-Type: application/json' \
  -d '{"name":"Metformin","dosage":"500 mg","timesOfDay":["08:00","20:00"],"startDate":"2026-09-01"}'
```

## Scripts

| Command | What it does |
|---|---|
| `npm run start:dev` | Run with hot reload |
| `npm run build` | Compile to `dist/` |
| `npm test` | Unit tests |
| `npm run test:e2e` | End-to-end tests against the full HTTP app (always in-memory) |
| `npm run test:int` | Integration tests against real PostgreSQL (needs `TEST_DATABASE_URL`) |
| `npm run test:cov` | Unit tests with coverage |
| `npm run lint` | Lint with oxlint |
| `npm run typecheck` | Type-check source and test files |
| `npm run format:check` | Check formatting with Prettier |

## Project layout

```
src/
├── main.ts          # Entry point: creates the app and starts listening
├── app.module.ts    # Root module
├── app.setup.ts     # App-wide config shared by main.ts and e2e tests
├── database/        # Kysely client, table types, migrations
├── health/          # GET /health
└── medications/     # Medication schedules: controller, service, repositories, DTOs
test/                # End-to-end (*.e2e-spec.ts) and integration (*.int-spec.ts) tests
```
