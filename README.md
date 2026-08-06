# ChronicCare Pro

Intelligent Chronic Disease Management Platform — mobile-first healthcare platform helping patients manage diabetes, hypertension, COPD, and heart disease through AI-driven insights, continuous monitoring, medication adherence tracking, and personalized recommendations.

> This repository currently contains the **project folder structure only**. No application code has been implemented yet — see `PROJECT_STRUCTURE.md` for the full layout and rationale.

## Repository Map

| Path | Purpose |
|---|---|
| [apps/](apps/) | End-user applications: patient mobile app, provider web portal, internal admin portal |
| [services/](services/) | Backend microservices (medication, monitoring, insights, billing, etc.) |
| [ai-ml/](ai-ml/) | Machine learning models, training pipelines, and evaluation for predictive/personalized insights |
| [integrations/](integrations/) | Third-party integrations: wearables, EHR/FHIR, pharmacy, insurance payers, telehealth |
| [shared/](shared/) | Cross-app shared code: design system, common libraries, shared types/constants |
| [data/](data/) | Database schemas, migrations, seed data, analytics warehouse definitions |
| [infrastructure/](infrastructure/) | IaC (Terraform/Kubernetes/Docker), CI/CD, observability, per-environment configs |
| [compliance/](compliance/) | HIPAA, security policies, audit logging, data privacy (GDPR), certifications |
| [docs/](docs/) | Architecture docs, API specs, product/business docs, user guides |
| [tests/](tests/) | Unit, integration, end-to-end, performance, and security tests |
| [scripts/](scripts/) | Deployment, data migration, and internal tooling scripts |
| [config/](config/) | Environment-specific application configuration |
| [.github/](.github/) | GitHub Actions workflows |

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for details on how this structure maps to the product proposal.
