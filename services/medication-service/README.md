# medication-service

Backend service for the **Smart Medication Tracker** feature of ChronicCare Pro: medication schedules, dose logging, and adherence tracking.

Built with [NestJS](https://nestjs.com/) (TypeScript, ES modules), tested with [Vitest](https://vitest.dev/), linted with [oxlint](https://oxc.rs/).

## Requirements

- Node.js 24+
- npm 11+

## Getting started

```bash
cd services/medication-service
npm install
npm run start:dev
```

The service listens on port `3001` by default (override with `PORT`).

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

Unknown fields are rejected with `400 Bad Request`.

```bash
curl -X POST http://localhost:3001/api/v1/patients/5f0c7a1e-8a51-4a8e-9a4b-1f7c3a2b9d01/medications \
  -H 'Content-Type: application/json' \
  -d '{"name":"Metformin","dosage":"500 mg","timesOfDay":["08:00","20:00"],"startDate":"2026-09-01"}'
```

> Data is currently kept in memory and is lost when the service restarts. PostgreSQL storage is the next step.

## Scripts

| Command | What it does |
|---|---|
| `npm run start:dev` | Run with hot reload |
| `npm run build` | Compile to `dist/` |
| `npm test` | Unit tests |
| `npm run test:e2e` | End-to-end tests against the full HTTP app |
| `npm run test:cov` | Unit tests with coverage |
| `npm run lint` | Lint with oxlint |
| `npm run format:check` | Check formatting with Prettier |

## Project layout

```
src/
├── main.ts          # Entry point: creates the app and starts listening
├── app.module.ts    # Root module
├── app.setup.ts     # App-wide config shared by main.ts and e2e tests
├── health/          # GET /health
└── medications/     # Medication schedules: controller, service, repository, DTOs
test/                # End-to-end tests (*.e2e-spec.ts)
```
