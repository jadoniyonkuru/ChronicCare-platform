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

All feature endpoints live under the versioned prefix `/api/v1`.

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
└── health/          # GET /health
test/                # End-to-end tests (*.e2e-spec.ts)
```
