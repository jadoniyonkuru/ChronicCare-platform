# ADR 0001: Backend stack for services

- **Status:** Accepted
- **Date:** 2026-09-23

## Context

The [architecture overview](../overview.md) splits the backend into one service per capability (`services/*`) but left the language and framework open. The first service to be built is `medication-service`, the core of the Smart Medication Tracker. Whatever it uses becomes the template for the other services, so the choice needs to be made once, up front.

Requirements:
- Typed language, since the services handle health data with strict shapes (doses, schedules, vitals)
- Clear module boundaries, so a service can be split or merged later without rewrites
- Good testing support, so every feature ships with tests
- One language shared with the planned web and mobile clients where possible

## Decision

Backend services use **TypeScript on Node.js 24 with [NestJS](https://nestjs.com/) 12**:

| Concern | Choice |
|---|---|
| Framework | NestJS 12 (ES modules) |
| Tests | Vitest (unit `*.spec.ts`, end-to-end `*.e2e-spec.ts`) |
| Lint / format | oxlint, Prettier |
| CI | GitHub Actions, one workflow per service, triggered by path |
| API versioning | Feature routes under `/api/v1`; `GET /health` unversioned |

The ML work in `ai-ml/` is exempt and may use Python, since that ecosystem is far stronger for model training.

## Consequences

- The patient app (React Native) and provider portal (React/Next.js) can share TypeScript types with the services through `shared/types`.
- NestJS modules map directly onto the service boundaries in the overview.
- Every new service follows the `medication-service` layout: `app.setup.ts` for shared app configuration, a `health` module, and its own CI workflow.
- Database: PostgreSQL with Kysely, see [ADR 0002](0002-database.md).
