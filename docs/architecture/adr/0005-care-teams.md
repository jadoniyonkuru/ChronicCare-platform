# ADR 0005: Care teams based on patient consent

- **Status:** Accepted
- **Date:** 2026-10-04
- **Replaces:** the temporary "providers can read any patient" rule from ADR 0004

## Context

After ADR 0004, any provider could read any patient's medication data. Real clinical access is narrower: a doctor should only see the patients they care for, and patients should be able to see and control who that is.

Options considered:

| Option | Trade-off |
|---|---|
| Put the provider's patient ids in the access token | No lookup per request, but tokens grow with every patient, and removing access only takes effect when the token expires (up to an hour) |
| A separate care-team service | Clean ownership, but a network call on every request and another service to run, for one table |
| **A care-team table in medication-service** | One indexed lookup per provider request; changes apply immediately; the data lives next to the data it protects |

## Decision

- medication-service stores **care-team links**: `(patient_id, provider_id, added_at)`.
- **The patient decides.** Only the patient can add or remove providers from their care team. Providers cannot add themselves.
- A provider can **read** a patient's medications, doses and adherence only while linked to that patient. Providers still cannot change a patient's data.
- A provider can list the patients who added them (`GET /providers/:providerId/patients`), which the provider portal will use for its patient list.
- Access is checked on every request, so removing a provider takes effect immediately.

## Consequences

- Patients identify a provider by user id for now. A lookup by email (served by auth-service) can come with the patient app.
- medication-service cannot confirm that an id belongs to a provider, since accounts live in auth-service. A link to a non-provider id is harmless: only a valid provider token with that id can use it.
- When a second service needs the same rules (for example monitoring-service), care teams should move to their own service or to auth-service, with a short-lived cache to avoid a lookup on every request.
