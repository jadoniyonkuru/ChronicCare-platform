# ADR 0003: Frontend/backend repository layout

- **Status:** Accepted
- **Date:** 2026-09-26
- **Supersedes:** the folder layout in the original `PROJECT_STRUCTURE.md`

## Context

The repository started with a scaffold of about 90 empty placeholder folders (`apps/`, `services/`, `ai-ml/`, `integrations/`, `compliance/`, `shared/`, `tests/` and more) mirroring the full product proposal. Only one service had real code. The empty folders made the project hard to navigate and made it unclear what was built versus planned.

## Decision

Keep the repository as a monorepo with a clear split between frontend and backend, and create folders only when there is real content for them:

```
backend/          # API services, one folder per service (NestJS)
frontend/         # User-facing apps, one folder per app
docs/             # Architecture, decision records (ADRs), roadmap
infrastructure/   # Docker and deployment configuration
.github/          # CI workflows, one per app or service
docker-compose.yml
```

- Each service or app is self-contained: its own `package.json`, README, tests and CI workflow.
- Tests live next to the code they test (inside each service), not in a top-level `tests/` folder.
- Planned areas from the proposal (AI/ML, integrations, compliance) get a folder when work on them starts.

## Consequences

- The folder tree now shows exactly what exists; the roadmap shows what is planned.
- Paths in ADR 0001 and ADR 0002 that mention `services/` now refer to `backend/`.
- Shared TypeScript types between frontend and backend will go in a `shared/` folder when the first frontend app needs them.
