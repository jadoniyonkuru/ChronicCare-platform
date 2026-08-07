# System Architecture Overview

Day 1 of building out ChronicCare Pro. This document describes, at a high level, how the pieces defined in [PROJECT_STRUCTURE.md](../../PROJECT_STRUCTURE.md) fit together. It will evolve as real architecture decisions (stack, hosting, data flow details) are made.

## High-level flow

```
                         ┌─────────────────────┐
                         │   Patients / Users    │
                         └──────────┬───────────┘
                                    │
                       ┌────────────┴────────────┐
                       │                          │
              apps/mobile-app          apps/provider-portal
              (patient app)              (clinician/provider)
                       │                          │
                       └────────────┬─────────────┘
                                    │
                          services/api-gateway
                     (single entry point, auth check,
                            routing, rate limiting)
                                    │
        ┌────────────┬─────────────┼─────────────┬────────────┐
        │             │             │             │            │
  auth-service  medication-   monitoring-   insights-    community-/
                service        service       service    provider-/
                                                          billing-/
                                                       reporting-service
        │             │             │             │            │
        └─────────────┴─────────────┴──────┬──────┴────────────┘
                                            │
                          ┌─────────────────┴────────────────┐
                          │                                   │
                       data/                              ai-ml/
              (schemas, migrations,                 (models, training
               analytics warehouse)               pipelines, evaluation)
                          │                                   │
                          └─────────────────┬─────────────────┘
                                            │
                                integrations/
                 (wearables, EHR/FHIR, pharmacy, insurers, telehealth)
```

Cutting across all of the above: **infrastructure/** (hosting, CI/CD, observability) and **compliance/** (HIPAA, security policy, audit logging, data privacy) apply to every layer, not just one — every service that touches patient data must go through them.

## Layers

1. **Client apps** (`apps/`) — patient mobile app, provider web portal, internal admin portal. These never talk to services directly; everything goes through the gateway.
2. **API gateway** (`services/api-gateway`) — single entry point. Handles routing, auth verification, and rate limiting before requests reach any backend service.
3. **Backend services** (`services/`) — one service per bounded capability (medication, monitoring, insights, community, provider, billing, reporting, notifications). Each owns its own data and can scale independently.
4. **Data & AI/ML** (`data/`, `ai-ml/`) — persistent storage (schemas, migrations, analytics warehouse) and the predictive/insights engine that reads from it.
5. **Integrations** (`integrations/`) — the boundary to the outside world: wearables, EHR/FHIR systems, pharmacy APIs, insurance payers, telehealth providers.
6. **Cross-cutting concerns** (`infrastructure/`, `compliance/`) — apply to every layer above: deployment, monitoring, HIPAA safeguards, audit logging.

## Status

This is a structural sketch, not a final design. Concrete decisions still to be made (tracked as they happen, one small piece at a time):
- [ ] Client app stack (e.g. React Native vs Flutter for `apps/mobile-app`)
- [ ] Backend language/framework per service
- [ ] Database choice(s) for `data/`
- [ ] Hosting/cloud provider for `infrastructure/`
- [ ] Auth approach (`services/auth-service`)
