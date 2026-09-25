# ADR 0002: PostgreSQL with Kysely for service storage

- **Status:** Accepted
- **Date:** 2026-09-25

## Context

`medication-service` kept medications in memory, so all data was lost on restart. The platform will store clinical data (medication schedules, dose logs, vitals) that is relational, needs strong consistency, and will eventually be subject to HIPAA audit requirements. The [architecture overview](../overview.md#status) left the database choice open.

For the data-access layer, options considered:

| Option | Why not (or why) |
|---|---|
| Prisma | Popular, but at the time of writing its CLI and client releases were on mismatched major versions (8.x pre-release vs 7.x), and it adds a code-generation step |
| TypeORM | Decorator-heavy entities blur the line between domain types and storage |
| Raw `pg` | No type checking of queries; migrations would need a hand-written runner |
| **Kysely** | Type-safe SQL query builder, no code generation, built-in migrations, stays close to real SQL |

## Decision

- **Database:** PostgreSQL 18. Each service owns its own tables; no service reads another's tables directly.
- **Access:** [Kysely](https://kysely.dev/) on the `pg` driver, with `CamelCasePlugin` so TypeScript uses `camelCase` and SQL uses `snake_case`.
- **Migrations:** Kysely `Migrator` with migrations registered in code (`src/database/migrations/index.ts`) and applied automatically on service start-up.
- **Local development:** Postgres from the repo's `docker-compose.yml`, with a separate `chroniccare_test` database for integration tests.
- **Fallback:** if `DATABASE_URL` is unset, the service uses in-memory storage, so it still runs (and unit/e2e tests stay fast) without Docker.

## Consequences

- Business logic depends on the `MedicationsRepository` abstraction, so the storage swap needs no service changes.
- Data rules are enforced twice: in request validation and as database constraints (e.g. `end_date >= start_date`).
- Integration tests against real Postgres run separately (`npm run test:int`) and in CI with a Postgres service container.
- Running migrations on start-up is fine while each service runs as a single instance. Once services scale horizontally, migrations should move to a separate deploy step.
