# auth-service

User accounts and login for ChronicCare Pro. Issues the JWT access tokens that the other services (such as [medication-service](../medication-service/)) require. Design decisions are in [ADR 0004](../../docs/architecture/adr/0004-authentication.md).

Built with [NestJS](https://nestjs.com/) and [PostgreSQL](https://www.postgresql.org/) via [Kysely](https://kysely.dev/), tested with [Vitest](https://vitest.dev/).

## Getting started

### Run with Docker

```bash
# From the repository root
docker compose up -d --build
docker compose exec auth-service node dist/database/seed.js   # optional demo accounts
```

### Develop with hot reload

```bash
# From the repository root: start only PostgreSQL
docker compose up -d postgres

cd backend/auth-service
cp .env.example .env
npm install
npm run start:dev
```

The service listens on port `3002`. Interactive API documentation is at **http://localhost:3002/docs**.

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness check |
| `POST` | `/api/v1/auth/register` | Create a patient account; returns an access token |
| `POST` | `/api/v1/auth/login` | Log in with email and password; returns an access token |
| `GET` | `/api/v1/auth/me` | The account the access token belongs to (requires `Authorization: Bearer <token>`) |

```bash
curl -X POST http://localhost:3002/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"patient@demo.chroniccare.dev","password":"demo-password-2026"}'
# {"accessToken":"eyJ…","tokenType":"Bearer","expiresIn":3600,"user":{…,"role":"patient"}}
```

Send the token to other services as `Authorization: Bearer <accessToken>`. Tokens expire after one hour.

### Rules

| Rule | Detail |
|---|---|
| Who can register | Patients only. Provider accounts are created by an administrator (for now, the seed script), so nobody can sign up as a doctor. |
| Email | Trimmed and lower-cased; one account per email (`409 Conflict` if taken). |
| Password | 10 to 128 characters. Stored only as a salted scrypt hash. |
| Failed login | Always `401 Invalid email or password`, whether the email exists or not, with similar response time. |
| Rate limit | 10 register or login attempts per client per minute (`429 Too Many Requests`). |

### Demo accounts

Created by the seed script. The password is public, so never seed a real deployment.

| Role | Email | Password |
|---|---|---|
| Patient | `patient@demo.chroniccare.dev` | `demo-password-2026` |
| Provider | `provider@demo.chroniccare.dev` | `demo-password-2026` |

The demo patient has the same id as the demo patient in medication-service, so after seeding both services their medication history is visible when logged in.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `JWT_SECRET` | (required) | Signs access tokens, at least 32 characters. Must match the services that verify tokens. |
| `DATABASE_URL` | unset (in-memory) | PostgreSQL connection; migrations run on start-up. |
| `JWT_EXPIRES_IN_SECONDS` | `3600` | Access token lifetime. |
| `AUTH_RATE_LIMIT_PER_MINUTE` | `10` | Register and login attempts per client per minute. |
| `SCRYPT_LOG_N` | `17` | Password hashing cost (2^N). Only lowered in tests. |

## Scripts

| Command | What it does |
|---|---|
| `npm run start:dev` | Run with hot reload |
| `npm run build` | Compile to `dist/` |
| `npm run db:seed` | Create the demo accounts in `DATABASE_URL` (run `npm run build` first) |
| `npm test` | Unit tests |
| `npm run test:e2e` | End-to-end tests against the full HTTP app (in-memory) |
| `npm run test:int` | Integration tests against real PostgreSQL (needs `TEST_DATABASE_URL`) |
| `npm run lint` / `npm run typecheck` / `npm run format:check` | Code quality checks |

## Project layout

```
src/
├── auth/            # Register, login, tokens, password hashing, guard
├── users/           # User model and repositories (in-memory, PostgreSQL)
├── database/        # Kysely client, migrations, demo seed
├── health/          # GET /health
├── app.setup.ts     # App-wide config shared by main.ts and e2e tests
└── openapi.ts       # Swagger docs at /docs
test/                # End-to-end (*.e2e-spec.ts) and integration (*.int-spec.ts) tests
```
