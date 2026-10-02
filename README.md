# ChronicCare Pro

A chronic disease management platform that helps patients with diabetes, hypertension, COPD and heart disease stay on top of their medication, with care teams able to follow their progress.

[![medication-service](https://github.com/jadoniyonkuru/ChronicCare-platform/actions/workflows/medication-service.yml/badge.svg)](https://github.com/jadoniyonkuru/ChronicCare-platform/actions/workflows/medication-service.yml)
[![auth-service](https://github.com/jadoniyonkuru/ChronicCare-platform/actions/workflows/auth-service.yml/badge.svg)](https://github.com/jadoniyonkuru/ChronicCare-platform/actions/workflows/auth-service.yml)
[![full-stack](https://github.com/jadoniyonkuru/ChronicCare-platform/actions/workflows/stack.yml/badge.svg)](https://github.com/jadoniyonkuru/ChronicCare-platform/actions/workflows/stack.yml)

> **Status:** early development, built in small tested steps. See the [roadmap](docs/roadmap.md) for what's done and what's next.

## What works today

| Component | Status |
|---|---|
| [backend/auth-service](backend/auth-service/) | Patient registration and login with scrypt-hashed passwords, rate limiting and JWT access tokens |
| [backend/medication-service](backend/medication-service/) | Medication schedules, dose logging (taken / skipped) and adherence reports. Every request needs an access token; patients only reach their own data, providers have read-only access |
| [frontend/](frontend/) | Planned: patient mobile app and provider web portal |

Both services have Swagger API docs, Docker images, demo data, and unit, end-to-end and PostgreSQL integration tests. A full-stack CI job starts everything with Docker Compose and tests it over HTTP on every push.

## Tech stack

| Area | Technology |
|---|---|
| Backend | TypeScript, Node.js 24, NestJS 12 |
| Database | PostgreSQL 18, Kysely (queries and migrations) |
| Security | JWT access tokens (HS256), scrypt password hashing, rate limiting |
| Testing | Vitest, Supertest |
| Code quality | oxlint, Prettier, TypeScript type-checking |
| Frontend (planned) | React Native with Expo (patient app), Next.js (provider portal) |
| Infrastructure | Docker Compose, GitHub Actions |

The reasons behind each choice are recorded in the [architecture decision records](docs/architecture/adr/).

## Project structure

```
ChronicCare-platform/
├── backend/
│   ├── auth-service/          # Accounts, login, access tokens (port 3002)
│   └── medication-service/    # Medications, doses, adherence (port 3001)
├── frontend/                  # Patient app and provider portal (planned)
├── docs/
│   ├── architecture/          # System overview and decision records (ADRs)
│   └── roadmap.md             # Build order and progress
├── infrastructure/
│   └── docker/                # Database initialisation scripts
├── .github/workflows/         # CI per service, plus a full-stack smoke test
└── docker-compose.yml         # PostgreSQL + both services
```

## Quick start

Only Docker is needed:

```bash
docker compose up -d --build                                          # PostgreSQL + both services
docker compose exec auth-service node dist/database/seed.js          # demo accounts
docker compose exec medication-service node dist/database/seed.js    # demo medication history
```

Then:

1. Open **http://localhost:3002/docs** and call `POST /api/v1/auth/login` with
   `{"email": "patient@demo.chroniccare.dev", "password": "demo-password-2026"}`. Copy the `accessToken`.
2. Open **http://localhost:3001/docs**, click **Authorize**, and paste the token.
3. Call `GET /api/v1/patients/{patientId}/adherence` with patient id `5f0c7a1e-8a51-4a8e-9a4b-1f7c3a2b9d01`.

Log in as `provider@demo.chroniccare.dev` (same password) to see the same report as a doctor, read-only.

Stop everything with `docker compose down`. To develop with hot reload instead, see each service's README.

> If you already had the database volume from before auth-service existed, recreate it once so the auth databases are created: `docker compose down -v`.

## Documentation

- [Architecture overview](docs/architecture/overview.md)
- [Decision records (ADRs)](docs/architecture/adr/)
- [Roadmap](docs/roadmap.md)
