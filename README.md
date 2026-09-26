# ChronicCare Pro

A chronic disease management platform that helps patients with diabetes, hypertension, COPD and heart disease stay on top of their medication, with care teams able to follow their progress.

[![medication-service CI](https://github.com/jadoniyonkuru/ChronicCare-platform/actions/workflows/medication-service.yml/badge.svg)](https://github.com/jadoniyonkuru/ChronicCare-platform/actions/workflows/medication-service.yml)

> **Status:** early development, built in small tested steps. See the [roadmap](docs/roadmap.md) for what's done and what's next.

## What works today

| Component | Status |
|---|---|
| [backend/medication-service](backend/medication-service/) | Medication schedules, dose logging (taken / skipped) and adherence reports, stored in PostgreSQL, with unit, end-to-end and integration tests and CI |
| [frontend/](frontend/) | Planned: patient mobile app and provider web portal |

## Tech stack

| Area | Technology |
|---|---|
| Backend | TypeScript, Node.js 24, NestJS 12 |
| Database | PostgreSQL 18, Kysely (queries and migrations) |
| Testing | Vitest, Supertest |
| Code quality | oxlint, Prettier, TypeScript type-checking |
| Frontend (planned) | React Native with Expo (patient app), Next.js (provider portal) |
| Infrastructure | Docker Compose, GitHub Actions |

The reasons behind each choice are recorded in the [architecture decision records](docs/architecture/adr/).

## Project structure

```
ChronicCare-platform/
├── backend/
│   └── medication-service/    # Medication schedules API (NestJS + PostgreSQL)
├── frontend/                  # Patient app and provider portal (planned)
├── docs/
│   ├── architecture/          # System overview and decision records (ADRs)
│   └── roadmap.md             # Build order and progress
├── infrastructure/
│   └── docker/                # Database initialisation scripts
├── .github/workflows/         # CI: lint, type-check, tests, build
└── docker-compose.yml         # Local PostgreSQL
```

## Quick start

Requires Node.js 24+ and Docker.

```bash
docker compose up -d                 # start PostgreSQL
cd backend/medication-service
cp .env.example .env
npm install
npm run start:dev
curl http://localhost:3001/health
```

See the [medication-service README](backend/medication-service/README.md) for the API and test commands.

## Documentation

- [Architecture overview](docs/architecture/overview.md)
- [Decision records (ADRs)](docs/architecture/adr/)
- [Roadmap](docs/roadmap.md)
