# Frontend

User-facing applications for ChronicCare Pro. Each app lives in its own folder and talks to the backend only through its HTTP API.

| App | Users | Stack | Status |
|---|---|---|---|
| `patient-app/` | Patients | React Native with Expo (TypeScript) | Planned |
| `provider-portal/` | Doctors and care teams | Next.js (TypeScript) | Planned |

## Conventions

- TypeScript everywhere, so request and response types can be shared with the backend.
- Apps never connect to a database directly; all data goes through the backend services in [../backend](../backend/).
- Each app gets its own README, its own `package.json`, and its own CI workflow in `.github/workflows/`, like [medication-service](../backend/medication-service/).
