# ADR 0004: Authentication with auth-service and JWT access tokens

- **Status:** Accepted
- **Date:** 2026-10-02

## Context

Every medication endpoint takes the patient id from the URL, so anyone who knows (or guesses) a patient id can read and change that patient's data. The platform handles health data, so it needs user accounts, secure password storage, and a way for each service to know who is calling.

## Decision

### A separate `auth-service` owns user accounts

- Stores users (email, full name, role, password hash) in its **own database** (`chroniccare_auth`). Other services never read it; they only trust the tokens it issues.
- Roles: `patient` and `provider`.
- **Patients register themselves.** Provider accounts cannot be self-registered, because anyone could claim to be a doctor. They are created by an administrator (for now, the seed script).

### Passwords

- Hashed with **scrypt** from Node's built-in `crypto` module: memory-hard, recommended by OWASP, and no native dependency to compile.
- Each hash stores its own random salt and parameters (`scrypt$N$r$p$salt$hash`), so parameters can be raised later without breaking existing accounts.
- Compared with `crypto.timingSafeEqual`.
- Minimum 10 characters. Emails are trimmed and lower-cased so `Ana@X.com` and `ana@x.com` are the same account.
- Login failures always return the same message, and an unknown email still runs a hash comparison, so responses do not reveal which emails are registered.
- Login attempts are rate limited per client.

### Tokens

- On login or registration, auth-service returns a signed **JWT access token**, valid for 1 hour.
- Claims: `sub` (user id), `role`, `iss: chroniccare-auth`, `aud: chroniccare-api`.
- Signed with **HS256** using a secret (`JWT_SECRET`) shared with the services that verify tokens.

## Consequences

- `medication-service` will verify tokens itself (no call to auth-service per request) and use `sub` and `role` to decide access.
- Sharing one HS256 secret means every verifying service could also mint tokens. That is acceptable while all services are ours and run together. When services are deployed independently, switch to asymmetric signing (EdDSA) with a public JWKS endpoint, so only auth-service holds a signing key.
- No refresh tokens yet: clients log in again after an hour. Refresh tokens with rotation come with the patient app.
- Database code (Kysely setup, migrations runner) is duplicated between the two services for now. If a third service needs it, it moves into a shared package.
