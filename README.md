# Dryink

## Overview

Dryink is an AI-powered video generation platform that enables users to create engaging videos using natural language prompts. It uses Google Gemini to generate HTML/JS animations, renders them via Puppeteer, and encodes them to MP4 with FFmpeg — all asynchronously via a background worker queue.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Client (Browser)                                           │
│  Next.js 15 · NextAuth · Razorpay                          │
└──────────────┬──────────────────────────────────────────────┘
               │ REST API
┌──────────────▼──────────────────────────────────────────────┐
│  Backend API  (Express 5 · Port 5000)                       │
│  Auth · Prompts · Sessions · Payments · Export queue        │
└────────┬─────────────────────────┬───────────────────────────┘
         │ Prisma ORM              │ BullMQ jobs
┌────────▼──────────┐    ┌─────────▼────────────────────────┐
│  PostgreSQL        │    │  Worker  (Port 5001)             │
│  (users, sessions, │    │  Puppeteer → FFmpeg → GCP        │
│   jobs, payments)  │    │  Consumes 'video-export' queue   │
└────────────────────┘    └─────────────────────────────────┘
                                        │
                           ┌────────────▼──────────┐
                           │  Redis (BullMQ queue)  │
                           └───────────────────────┘
                                        │
                           ┌────────────▼──────────┐
                           │  GCP Cloud Storage     │
                           │  (rendered MP4s)       │
                           └───────────────────────┘
```

**Video generation flow:**
1. User submits a prompt → backend calls Gemini → returns generated HTML animation code
2. HTML is previewed instantly in an iframe (hybrid rendering)
3. User triggers export → job queued in Redis via BullMQ
4. Worker picks up job: Puppeteer renders frames → FFmpeg encodes MP4 → uploaded to GCP
5. Job progress (0–100%) is polled by the frontend until complete

## Project Structure

This is an **npm workspaces monorepo**: one root `package.json` owns the workspace list (`apps/*`, `packages/*`) and orchestration scripts, and there is a single root `node_modules` / `package-lock.json` shared by every package. Packages are scoped under `@dryink/*` (`@dryink/be`, `@dryink/fe`, `@dryink/worker`, `@dryink/db`), and `apps/be`/`apps/worker` depend on `@dryink/db` as a real workspace dependency rather than a relative path.

```
dryink/
├── package.json                # Root workspace config + orchestration scripts
├── package-lock.json            # Single lockfile for the whole monorepo
├── .gitignore                   # Root-level ignores (node_modules/)
│
├── apps/
│   ├── fe/                      # Frontend — Next.js 15 (@dryink/fe)
│   │   ├── app/
│   │   │   ├── (auth)/          # Login & signup pages
│   │   │   ├── (main)/          # Dashboard & session views
│   │   │   │   └── [sessionId]/ # Per-session route
│   │   │   ├── api/auth/        # NextAuth.js handler
│   │   │   └── pricing/         # Pricing page
│   │   ├── components/
│   │   │   ├── AuthComponent/   # Auth UI
│   │   │   ├── dashboard/       # Dashboard UI
│   │   │   ├── herosection/     # Landing hero
│   │   │   ├── navs/            # Navigation
│   │   │   ├── recorder/        # Video recorder
│   │   │   ├── ui/              # Radix-based primitives
│   │   │   └── ...
│   │   ├── contexts/
│   │   │   └── CreditsContext.tsx  # User credits state
│   │   ├── lib/
│   │   │   ├── authOptions.ts   # NextAuth config
│   │   │   └── sanitizeCode.ts  # HTML sanitization
│   │   ├── Dockerfile.dev       # Dev container
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   ├── be/                      # Backend API — Express 5 (@dryink/be)
│   │   ├── src/
│   │   │   ├── index.ts         # App entry & route wiring
│   │   │   ├── controllers/
│   │   │   │   ├── authController.ts      # Login / signup / JWT
│   │   │   │   ├── promController.ts      # LLM prompt & generation
│   │   │   │   ├── exportController.ts    # Submit export job
│   │   │   │   ├── paymentController.ts   # Razorpay order & verify
│   │   │   │   ├── sessionController.ts   # Chat session CRUD
│   │   │   │   ├── editorController.ts    # Code editor endpoints
│   │   │   │   └── contactController.ts   # Contact form
│   │   │   ├── routes/          # Route definitions
│   │   │   ├── client/
│   │   │   │   └── prismaClient.ts  # Imports the shared prisma client from @dryink/db
│   │   │   ├── configs/
│   │   │   │   ├── gcpClient.ts # GCP auth
│   │   │   │   └── queueConfig.ts  # BullMQ queue init
│   │   │   ├── middleware/
│   │   │   │   └── auth.ts      # JWT auth middleware
│   │   │   └── lib/
│   │   │       ├── prompts.ts   # Gemini prompt templates
│   │   │       └── logger.ts    # Pino logger
│   │   └── package.json         # depends on "@dryink/db": "*"
│   │
│   └── worker/                  # Background worker — BullMQ (@dryink/worker)
│       ├── src/
│       │   ├── index.ts         # Worker entrypoint (port 5001)
│       │   ├── configs/
│       │   │   └── prismaclient.ts  # Imports the shared prisma client from @dryink/db
│       │   └── core/
│       │       └── operation.ts # Puppeteer → FFmpeg pipeline
│       └── package.json         # depends on "@dryink/db": "*"
│
├── packages/
│   └── db/                      # Shared DB package — Prisma (@dryink/db)
│       ├── prisma/
│       │   ├── schema.prisma    # 7 models
│       │   └── migrations/      # 5 migrations
│       ├── src/index.ts         # Exports the shared `prisma` client
│       └── package.json         # main/types point at dist/, postinstall runs `prisma generate`
│
├── docker/
│   ├── be/Dockerfile            # Production backend image
│   └── worker/Dockerfile        # Production worker image (Puppeteer)
│
├── scripts/
│   └── docker-setup.sh          # Automated setup script
├── docker-compose.yaml          # Local dev: Postgres + Redis
└── README.md
```

> **Note:** `docker/be/Dockerfile`, `docker/worker/Dockerfile`, `docker-compose.yaml`, and `scripts/docker-setup.sh` still reference the pre-monorepo flat paths (`db/`, `be/`, `worker/`) and have **not** been updated for the `apps/`/`packages/` layout yet — that's tracked as separate follow-up work. Everything under "Running without Docker" below reflects the current, working setup.

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | npm workspaces (`apps/*`, `packages/*`) |
| Frontend | Next.js 15, React 19, Tailwind CSS v4, Radix UI, NextAuth |
| Backend | Node.js, Express 5, TypeScript, Pino |
| ORM | Prisma 6 (shared `@dryink/db` workspace package) |
| Database | PostgreSQL |
| Queue | Redis + BullMQ |
| Video | Puppeteer (headless Chrome), FFmpeg |
| Storage | GCP Cloud Storage |
| AI/LLM |  OpenRouter |
| Payments | Razorpay |
| Auth | JWT + NextAuth.js + GitHub OAuth |

## Prerequisites

- Node.js v22+
- npm (workspaces support, npm 7+)
- Docker & Docker Compose (for running Postgres and Redis locally)
- OpenRouter API key
- GCP project + service account with Cloud Storage access
- GitHub OAuth app (for social login)
- Razorpay account (for payments)

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/nafri/dryink.git
cd dryink
```

### 2. Environment variables

Copy `.env.example` to `.env` in each service directory:

```bash
cp apps/be/.env.example apps/be/.env
cp apps/fe/.env.example apps/fe/.env
cp apps/worker/.env.example apps/worker/.env
```

#### `apps/be/.env`

```env
PORT=5000
JWT_SECRET='your-jwt-secret'
OPENROUTER_API_KEY='your-openrouter-key'
GCP_PROJECT_ID='your-gcp-project-id'
GCP_BUCKET_NAME='your-gcp-bucket-name'
GCP_KEY_FILE='/path/to/service-account-key.json'
REDIS_URL='redis://localhost:6379'
DATABASE_URL='postgresql://postgres:postgres@localhost:5432/dryink'
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

#### `apps/fe/.env`

```env
NEXT_PUBLIC_BACKEND_BASE_URL='http://localhost:5000/api/v1'
NEXTAUTH_SECRET='your-nextauth-secret'
JWT_SECRET='your-jwt-secret'
GITHUB_ID='your-github-oauth-app-id'
GITHUB_SECRET='your-github-oauth-app-secret'
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
```

#### `apps/worker/.env`

```env
DATABASE_URL='postgresql://postgres:postgres@localhost:5432/dryink'
GCP_PROJECT_ID='your-gcp-project-id'
GCP_BUCKET_NAME='your-gcp-bucket-name'
GCP_KEY_FILE='/path/to/service-account-key.json'
REDIS_URL='redis://localhost:6379'
```

---

## Running without Docker (local dev)

### 1. Start Postgres and Redis

The `docker-compose.yaml` spins up only the infrastructure services:

```bash
docker compose up -d
```

This starts:
- PostgreSQL on `localhost:5432` (user: `postgres`, password: `postgres`, db: `dryink`)
- Redis on `localhost:6379`

### 2. Install dependencies

A single install at the repo root sets up every workspace (`apps/be`, `apps/fe`, `apps/worker`, `packages/db`) and generates the Prisma client automatically via `packages/db`'s `postinstall` hook:

```bash
npm install
```

### 3. Run Prisma migrations

```bash
npm run db:migrate
```

### 4. Build the workspace (optional, for a production-style check)

```bash
npm run build
# Builds packages/db first, then apps/be, apps/worker, apps/fe — in that order,
# since be/worker import @dryink/db's compiled dist/ output.
```

### 5. Start all services (3 terminals)

**Terminal 1 — Backend API:**
```bash
npm run dev:be
# Listening on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
npm run dev:fe
# Listening on http://localhost:3000
```

**Terminal 3 — Worker:**
```bash
npm run dev:worker
# Listening on http://localhost:5001
```

All three `dev:*` scripts, plus `build`, `build:db`, `build:be`, `build:worker`, `build:fe`, `db:generate`, and `db:migrate`, are defined once in the root `package.json` and delegate to the relevant workspace via `npm run <script> -w <workspace>`.

---

## Running with Docker

> **Note:** The `docker-compose.yaml` is currently configured for infrastructure only (Postgres + Redis). The `be`, `fe`, and `worker` services have production Dockerfiles under `docker/be/` and `docker/worker/` respectively, and a dev Dockerfile at `apps/fe/Dockerfile.dev`. **These Dockerfiles have not yet been updated for the `apps/`/`packages/` monorepo layout** — they still `COPY` from the old flat `db/`, `be/`, `worker/` paths internally and will need rewriting before Option B below will actually build. Option A (infra-only + local services) is the reliable path for now.

### Option A — Infrastructure only + local services (recommended for dev)

```bash
# Start Postgres + Redis
docker compose up -d

# Then run fe, be, worker locally as described above
```

### Option B — Build and run all services with Docker (not yet updated for the monorepo layout)

```bash
# Backend
docker build -f docker/be/Dockerfile -t dryink-be .

# Worker (includes Chromium + FFmpeg dependencies)
docker build -f docker/worker/Dockerfile -t dryink-worker .

# Frontend (dev image)
docker build -f apps/fe/Dockerfile.dev -t dryink-fe ./apps/fe
```

> The worker image bundles Chromium (via Puppeteer) and FFmpeg. It requires extra Linux system libraries (fonts, GTK, X11) that are handled in the multi-stage `docker/worker/Dockerfile`. As noted above, `docker/be/Dockerfile` and `docker/worker/Dockerfile` still reference pre-monorepo paths and need updating before these builds will succeed.

### Automated setup script

A helper script exists at `scripts/docker-setup.sh` for first-time setup, but like the Dockerfiles above, **it still references the old flat `be/`, `worker/`, `db/` paths and hasn't been updated for the monorepo layout yet** — use the manual steps under "Running without Docker" above instead until it's updated.

---

## API Routes

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/api/v1/auth/login` | Login (rate-limited: 10/15 min) |
| `POST` | `/api/v1/auth/signup` | Signup (rate-limited: 5/60 min) |
| `GET` | `/api/v1/auth/me` | Current user |
| `POST` | `/api/v1/prompt` | Generate animation from prompt |
| `POST` | `/api/v1/editor` | Update animation code |
| `GET` | `/api/v1/sessions` | List chat sessions |
| `GET` | `/api/v1/sessions/:id` | Get session with chats |
| `POST` | `/api/v1/export` | Submit video export job (rate-limited: 3/10 min) |
| `POST` | `/api/v1/payment/order` | Create Razorpay order |
| `POST` | `/api/v1/payment/verify` | Verify payment & credit account |
| `POST` | `/api/v1/contact` | Contact form submission |

## Database Schema

```
User ─────────────── ChatSession ── Chat ── Job
  │                                    │
  └── Transaction                      └── (genUrl → GCP)
```

- **User**: id, email, password, name, authProvider, credits
- **ChatSession**: groups chats per user session
- **Chat**: prompt, AI response, generated HTML code, video URL
- **Job**: video export job with status (`PENDING` → `PROCESSING` → `COMPLETED`/`FAILED`) and 0–100 progress
- **Transaction**: Razorpay payment records linked to credit top-ups

## Development

### Running tests

```bash
npm test -w apps/be    # Vitest unit tests
```

### Code style

- ESLint + Prettier for formatting
- Strict TypeScript throughout
- Pino for structured logging (backend + worker)

## License

MIT License — see [LICENSE](LICENSE) for details.
