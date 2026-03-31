# RevSage — Document processing platform

Users submit text documents for asynchronous processing. Jobs run on **BullMQ** (Redis). The API is **NestJS** + **PostgreSQL**. The dashboard is **Next.js** (App Router) with **Socket.IO** for live status updates.

## Prerequisites

- **Docker** and **Docker Compose** (recommended), **or**
- **Node.js 22+**, **PostgreSQL**, and **Redis** if you run services manually.

## Assignment compliance (checklist)

| Requirement | How it is met |
|-------------|----------------|
| **Backend:** NestJS + TypeScript, PostgreSQL + Redis (Docker Compose) | `backend/`, `docker-compose.yml` |
| **Auth:** JWT register/login, bcrypt passwords | `auth/` module |
| **Documents:** title, content, type, status FSM QUEUED→PROCESSING→DONE/FAILED | `entities/`, `document-status.transitions.ts` |
| **Processing:** BullMQ queue, 5–10s delay, result placeholder, empty → FAILED, retries (up to 2) | `document.processor.ts` (`attempts: 3` = initial + 2 retries), `UnrecoverableError` for empty content |
| **Real-time:** WebSocket or SSE | Socket.IO namespace `/documents`, `document:update` events |
| **Deduplication:** same user + title + type within 60s → 409 | `documents.service.ts` |
| **Display name snapshot:** stored on document row at processing time | `processorDisplayName` on `Document` |
| **Frontend:** Next.js, login/register, JWT, dashboard filters/search, submit, detail live updates, profile | `frontend/app/`, `hooks/` |
| **Refactoring:** `REFACTORED.md` | Root `REFACTORED.md` |
| **DevOps:** Multi-stage backend Dockerfile, compose all services, seed, `.env.example` | `backend/Dockerfile`, `docker-compose.yml`, `backend/src/seed.ts`, root + `backend/` + `frontend/` `.env.example` |

## Environment

Env is **split by concern**:

| File | Used for |
|------|----------|
| **Repository root** `.env` | **Docker Compose** only — `cp .env.example .env` next to `docker-compose.yml`. Substitutes `${VAR}` in `docker-compose.yml` and supplies build args / container env. |
| **`backend/.env`** | Local **`npm run start:dev`** — `cp backend/.env.example backend/.env`. Nest loads this file first (see `backend/src/app.module.ts`). |
| **`frontend/.env.local`** | Local **`npm run dev`** — `cp frontend/.env.example frontend/.env.local`. Only **`NEXT_PUBLIC_*`** (safe for the browser). |

**Docker Compose (root `.env`)**

1. `cp .env.example .env` at the repo root.
2. Set **`JWT_SECRET`**, **`NEXT_PUBLIC_API_URL`** (default `http://localhost:3001` for published ports), and optional port overrides.
3. Rebuild the frontend image after changing `NEXT_PUBLIC_API_URL`: `docker compose build frontend --no-cache`.

**Containers:** the backend gets `DATABASE_*` / `REDIS_*` from `docker-compose.yml` (service names). The frontend image bakes **`NEXT_PUBLIC_*`** at **build** time from the root `.env`.

Root `.env` is gitignored. `backend/.env` and `frontend/.env.local` are gitignored via each app’s `.gitignore`.

## Quick start (Docker Compose)

From the repository root (with `.env` present):

```bash
docker compose up --build
```

- **Frontend:** http://localhost:3000 (or `FRONTEND_PORT`)
- **Backend API:** http://localhost:3001/api (or `BACKEND_PORT`)
- **Health:** http://localhost:3001/api/health
- **PostgreSQL / Redis:** mapped per `.env` / defaults in `docker-compose.yml`

### Seed data (after containers are healthy)

```bash
docker compose exec backend npm run seed:run
```

Or locally (from `backend/` after `npm run build`): `npm run seed:run`

**Direct login** at http://localhost:3000/login — same password for every seeded account:

| Email | Password |
|-------|----------|
| `alice@example.com` | `Password123!` |
| `bob@example.com` | `Password123!` |
| `carol@example.com` | `Password123!` |

Documents are created across different statuses for filters and the detail view.

## Local development (without Docker for Node apps)

1. Start **PostgreSQL** and **Redis** (or use Docker only for infra):

   ```bash
   docker compose up -d postgres redis
   ```

2. **Configure env for local npm**

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

   Edit **`backend/.env`** (Postgres/Redis/JWT) and **`frontend/.env.local`** (`NEXT_PUBLIC_API_URL`, usually `http://localhost:3001`).

3. **Backend**

   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

4. **Frontend** (new terminal)

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Seed** (optional)

   ```bash
   cd backend
   npm run seed
   ```

   (`seed` compiles then runs `dist/seed.js`; after a build you can use `npm run seed:run` only.)

## API overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register; returns JWT + user |
| POST | `/api/auth/login` | No | Login; returns JWT + user |
| GET | `/api/users/me` | Bearer JWT | Current profile |
| PATCH | `/api/users/me` | Bearer JWT | Update `displayName` |
| POST | `/api/documents` | Bearer JWT | Create document (queued + deduped within 60s) |
| GET | `/api/documents` | Bearer JWT | List (query: `status`, `type`, `search`) |
| GET | `/api/documents/:id` | Bearer JWT | Document detail |

**WebSocket:** connect Socket.IO to namespace `/documents` on the API origin (e.g. `http://localhost:3001/documents`) with `auth: { token: "<JWT>" }`. Events: `document:update` with `{ documentId, status, result, processorDisplayName, updatedAt }`.

## License

Private / assignment use unless stated otherwise.
