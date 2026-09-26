# System Architecture Overview

How the pieces of ChronicCare Pro fit together: what exists today and where planned parts will go. Folder layout is described in [ADR 0003](adr/0003-repository-layout.md).

## High-level flow

```
                  Patients                 Doctors / care teams
                     │                              │
        frontend/patient-app            frontend/provider-portal
        (React Native, Expo)                 (Next.js)
                     │                              │
                     └──────────────┬───────────────┘
                                    │  HTTPS + JSON
                                    │
        ┌───────────────────────────┼──────────────────────────┐
        │                           │                          │
 backend/auth-service   backend/medication-service   backend/monitoring-service
     (planned)              (built: NestJS)                (planned)
        │                           │                          │
        └───────────────────────────┼──────────────────────────┘
                                    │
                              PostgreSQL 18
                     (each service owns its own tables)
```

Planned later: an API gateway in front of the services, AI/ML insights (Python), and integrations with wearables, EHR/FHIR systems and pharmacies.

## Layers

1. **Frontend** (`frontend/`): the patient app and provider portal. They only talk to the backend over HTTP; they never touch the database.
2. **Backend** (`backend/`): one NestJS service per capability (medications, auth, monitoring, ...). Each service owns its data and has its own tests and CI.
3. **Data**: PostgreSQL, with schema changes as versioned migrations inside each service ([ADR 0002](adr/0002-database.md)).
4. **Infrastructure** (`infrastructure/`, `docker-compose.yml`, `.github/`): local Docker setup and CI. Security and privacy rules (HIPAA-style audit logging, access control) apply to every service that handles patient data.

## Decisions

- [x] Backend: TypeScript + NestJS ([ADR 0001](adr/0001-backend-stack.md))
- [x] Database: PostgreSQL with Kysely ([ADR 0002](adr/0002-database.md))
- [x] Repository layout: frontend/backend split ([ADR 0003](adr/0003-repository-layout.md))
- [ ] Frontend stack: React Native with Expo for the patient app, Next.js for the provider portal (planned; ADR when the first app starts)
- [ ] Authentication approach (`backend/auth-service`)
- [ ] Hosting / cloud provider
