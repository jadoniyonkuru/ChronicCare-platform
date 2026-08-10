# Roadmap

Derived from the project proposal's Go-to-Market Strategy and Key Milestones. This is the source of truth for "what are we building toward" — update it as real progress is made, and as dates/scope inevitably shift from the original pitch.

## Phase 1 — Pilot (Months 1–6)

**Goal:** Secure 2–3 pilot partnerships with regional health systems to validate ROI.

- [ ] Provider portal MVP (`apps/provider-portal`)
- [ ] Provider service + reporting service (`services/provider-service`, `services/reporting-service`)
- [ ] EHR/FHIR integration (`integrations/ehr-fhir`)
- [ ] HIPAA safeguards in place (`compliance/hipaa`)
- [ ] First health system pilot launch — **target: Q3 2026**

## Phase 2 — Direct-to-consumer launch (Months 7–12)

**Goal:** Launch consumer app with targeted marketing to diabetes and heart disease communities.

- [ ] Patient mobile app MVP (`apps/mobile-app`) — medication tracker, monitoring, insights
- [ ] Notification service (`services/notification-service`)
- [ ] Billing service — subscription support (`services/billing-service`)
- [ ] Consumer app launch — **target: Q4 2026, 50K users**

## Phase 3 — Enterprise & scale (Year 2)

**Goal:** Enterprise sales to major insurers; establish provider partnerships; expand AI capabilities.

- [ ] Insurance payer integrations (`integrations/insurance-payers`)
- [ ] B2B licensing support in billing service
- [ ] Expanded AI/ML insights (`ai-ml/`)
- [ ] Break-even on CAC; Series B ready — **target: Q2 2027**
- [ ] 500K+ active users; first enterprise customer — **target: Q4 2027**

## How this connects to daily work

Each day's small change should, where possible, chip away at one unchecked item above (or at a prerequisite for one — docs, schema, config, etc.). Check items off here as they're genuinely done, not just started.

See also: [system architecture overview](../../architecture/overview.md), [PROJECT_STRUCTURE.md](../../../PROJECT_STRUCTURE.md).
