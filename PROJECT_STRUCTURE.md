# Project Folder Structure — Rationale

This document maps the proposed folder structure to the ChronicCare Pro project proposal, so the repository is ready for implementation to begin.

## Design approach

The platform is structured as a **multi-app, microservices monorepo**, because the proposal describes three distinct user-facing surfaces (patient, provider, internal admin/ops), a set of independently scalable backend capabilities (medication tracking, monitoring, insights, billing, community), and a dedicated ML workstream — all of which have different release cadences, compliance requirements, and (eventually) engineering ownership.

```
ChronicCare-platform/
├── apps/                        # User-facing applications
│   ├── mobile-app/              # Patient mobile app (iOS/Android) — Smart Medication
│   │                             #   Tracker, Continuous Health Monitoring, Personalized
│   │                             #   Insights, Community Support
│   ├── provider-portal/         # Provider Portal — real-time patient data, early
│   │                             #   warning alerts, remote consultations
│   └── admin-portal/            # Internal ops/support console (user & content admin,
│                                 #   pilot/partner management)
│
├── services/                    # Backend microservices (one per bounded capability)
│   ├── api-gateway/             # Single entry point, routing, rate limiting, auth checks
│   ├── auth-service/            # Identity, authentication, authorization, consent
│   ├── medication-service/      # Reminders, adherence tracking, drug interaction alerts
│   ├── monitoring-service/      # Vitals, symptom logging, wearable data ingestion
│   ├── insights-service/        # Serves ML-driven recommendations & trend analysis
│   ├── notification-service/    # Push/SMS/email reminders and alerts
│   ├── community-service/       # Peer support groups, expert Q&A, education content
│   ├── provider-service/        # Provider dashboards, alerts, consultation scheduling
│   ├── billing-service/         # DTC subscriptions, B2B licensing, invoicing
│   └── reporting-service/       # ROI/outcomes reporting for health systems & insurers
│
├── ai-ml/                       # Proprietary AI engine (predictive insights)
│   ├── models/                  # Trained model artifacts
│   ├── training-pipelines/      # Training/retraining pipelines
│   ├── data-processing/         # Feature engineering, clinical data preprocessing
│   ├── evaluation/              # Model validation, bias/safety evaluation
│   ├── notebooks/               # Research & experimentation
│   └── model-registry/          # Versioning & deployment tracking
│
├── integrations/                # 200+ wearable/device & third-party integrations
│   ├── wearables/
│   │   ├── fitbit/
│   │   ├── apple-health/
│   │   ├── google-fit/
│   │   └── other-devices/
│   ├── ehr-fhir/                # Provider/hospital system data exchange (HL7/FHIR)
│   ├── pharmacy-apis/           # Prescription & drug interaction data
│   ├── insurance-payers/        # B2B insurer integrations
│   └── telehealth/              # Remote consultation providers
│
├── shared/                      # Code shared across apps/services
│   ├── design-system/           # Shared UI components, branding, accessibility
│   ├── libs/                    # Shared utility libraries
│   ├── types/                   # Shared data models/contracts
│   └── constants/
│
├── data/                        # Data layer
│   ├── schemas/                 # Database schemas
│   ├── migrations/
│   ├── seed-data/
│   └── analytics-warehouse/     # Analytics/BI data models
│
├── infrastructure/               # HIPAA-compliant, enterprise-ready infrastructure
│   ├── terraform/                # Cloud infrastructure as code
│   ├── kubernetes/               # Service deployment manifests
│   ├── docker/                   # Container definitions
│   ├── ci-cd/                    # Build/test/deploy pipelines
│   ├── monitoring-observability/ # Logging, metrics, alerting
│   └── environments/
│       ├── dev/
│       ├── staging/
│       └── production/
│
├── compliance/                  # Regulatory & trust requirements
│   ├── hipaa/                   # HIPAA policies, BAAs, safeguards
│   ├── security-policies/
│   ├── audit-logs/
│   ├── data-privacy-gdpr/
│   └── certifications/          # SOC 2, HITRUST, etc.
│
├── docs/                        # Documentation
│   ├── architecture/            # System design, ADRs
│   ├── api-specs/                # API contracts (OpenAPI, etc.)
│   ├── product/
│   │   ├── roadmap/              # Q3 2026 pilot → Q4 2027 milestones
│   │   └── user-research/
│   ├── business/
│   │   ├── pitch-deck/           # Series A materials
│   │   ├── financial-models/     # Revenue/burn projections
│   │   └── market-research/      # TAM, competitive analysis
│   ├── user-guides/
│   │   ├── patient/
│   │   └── provider/
│   └── onboarding/               # New team member / partner onboarding
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   ├── performance/
│   └── security/                 # Pen-test-adjacent test suites (HIPAA readiness)
│
├── scripts/
│   ├── deployment/
│   ├── data-migration/
│   └── tooling/
│
├── config/                       # Per-environment app configuration
│   ├── dev/
│   ├── staging/
│   └── production/
│
└── .github/
    └── workflows/                # CI/CD automation
```

## How this maps to the roadmap

- **Phase 1 (pilot, Months 1–6):** `apps/provider-portal`, `services/provider-service`, `services/reporting-service`, `integrations/ehr-fhir`, and `compliance/hipaa` are the priority build targets to support 2–3 health-system pilots.
- **Phase 2 (DTC launch, Months 7–12):** `apps/mobile-app`, `services/medication-service`, `services/notification-service`, and `services/billing-service` (subscription billing) come online.
- **Phase 3 (Year 2+, enterprise/insurers):** `integrations/insurance-payers`, `services/billing-service` (B2B licensing), and expanded `ai-ml/` capabilities for diagnostics.

## Next steps

This structure has no code yet — it is scaffolding only (each leaf folder contains a `.gitkeep` placeholder). Suggested next steps when implementation begins:
1. Pick stack per app/service (e.g., React Native for `mobile-app`, React/Next.js for `provider-portal`, and a language/framework for `services/*`).
2. Replace `.gitkeep` files with real code as each area is implemented.
3. Add a `README.md` inside each top-level folder describing its own conventions once concrete.
