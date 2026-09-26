# Roadmap

The build order for ChronicCare Pro, in small working slices. Each item is checked only when it is merged, tested and running in CI.

## Milestone 1: Medication tracking API

- [x] `medication-service` scaffold with health check, tests and CI
- [x] Medications: add, list, update, delete, with validation
- [x] PostgreSQL storage with migrations and integration tests
- [ ] Dose logging: record a dose as taken or skipped
- [ ] Adherence: percentage of scheduled doses taken over a period
- [ ] OpenAPI (Swagger) documentation

## Milestone 2: Accounts and security

- [ ] `auth-service`: patient and provider registration and login (JWT)
- [ ] Medication endpoints use the logged-in patient instead of an id in the URL
- [ ] Audit log of who read or changed patient data

## Milestone 3: Patient app

- [ ] `frontend/patient-app` (React Native, Expo): log in, today's doses, mark as taken
- [ ] Dose reminders (push notifications)

## Milestone 4: Provider portal and monitoring

- [ ] `frontend/provider-portal` (Next.js): patient list, adherence charts
- [ ] `monitoring-service`: blood pressure, glucose and heart rate readings with warning thresholds
- [ ] Early-warning alerts for providers

## Later

- AI/ML: predict which patients are likely to miss doses (Python)
- Integrations: wearables, EHR/FHIR, pharmacy data
- Deployment to a public demo environment

## Where this comes from

The product proposal describes a three-phase business plan: health-system pilots, a consumer app launch, then enterprise and insurer partnerships. The milestones above are the engineering path toward that: the medication tracker comes first because medication adherence is the proposal's core value.

See also: [architecture overview](architecture/overview.md).
