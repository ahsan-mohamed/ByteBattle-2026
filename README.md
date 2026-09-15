# ByteBattle

**National-Level Technical Quiz** — a full-stack quiz platform built for a
technical symposium, supporting 100+ simultaneous participants with a secure
backend, organizer-only admin dashboard, and no participant registration.

Footer on every participant page: *Designed & Developed by Ahsan Mohamed*

---

## 1. Overview

Participants open a link, enter their name, receive a backend-generated
unique ID (e.g. `BB2026-0001`), and take a 30-question timed quiz. They never
see their score, the correct answers, or a leaderboard — only a submission
confirmation. Organizers get a full admin dashboard: question management,
quiz lifecycle control (draft → published → active → ended, with questions
locked once active), results, a **manually refreshed** leaderboard, CSV
export, and Google Sheets sync.

## 2. Architecture

```
Participant Browser ──┐
                       ├──> Frontend (React/Vite, static) ──> Backend API (Express)
Organizer Browser ─────┘                                          │
                                                                    ├──> PostgreSQL (Prisma)
                                                                    └──> Google Sheets API
```

- The frontend is a single static SPA with two route trees: participant
  routes (`/`, `/start`, `/quiz`, `/submitted`) and admin routes
  (`/admin/*`), gated by a session cookie.
- The backend is stateless aside from the session store (in-memory by
  default — see note in section 8), so it can be redeployed freely; all
  quiz/participant state lives in PostgreSQL.
- The correct answer key, admin credentials, and Google service-account
  credentials never leave the backend.

## 3. Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, Axios, lucide-react
**Backend:** Node.js, TypeScript, Express, PostgreSQL, Prisma ORM, express-session, Helmet, Zod
**No Docker required.**

## 4. Folder Structure

```
bytebattle/
├── backend/
│   ├── src/
│   │   ├── controllers/   # request handlers
│   │   ├── routes/        # participantRoutes.ts, adminRoutes.ts
│   │   ├── middleware/     # adminAuth, errorHandler
│   │   ├── services/       # adminBootstrap, googleSheetsService
│   │   ├── utils/           # prisma client, validation, unique ID gen
│   │   └── server.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts          # 30 validated AI/ML questions (25 Medium / 5 Hard)
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/            # participant pages
│   │   ├── admin/             # admin app (pages, api, contexts, layout)
│   │   ├── components/        # shared UI (Button, Input, Modal) + quiz components
│   │   ├── hooks/               # timer, anti-cheat, session persistence
│   │   └── api/                  # axios client
│   ├── .env.example
│   └── package.json
└── README.md   (this file)
```

## 5. Local Development

### Prerequisites
- Node.js 18+
- A PostgreSQL database (local install, Docker-free — e.g. Postgres.app,
  or a free instance from Neon/Supabase/Render)

### Backend

```bash
cd backend
cp .env.example .env
# edit .env: set DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD, SESSION_SECRET

npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed          # loads the 30-question ByteBattle 2026 quiz (starts in DRAFT)
npm run dev            # http://localhost:4000
```

The first server boot also creates the admin account from `ADMIN_USERNAME`/
`ADMIN_PASSWORD` automatically (see `src/services/adminBootstrap.ts`).

### Frontend

```bash
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:4000/api
npm install
npm run dev             # http://localhost:5173
```

Visit `http://localhost:5173` for the participant flow and
`http://localhost:5173/admin/login` for the admin dashboard.

### Getting the seeded quiz ready to run

The seed creates the quiz in `DRAFT` status so you can review questions
first. To actually run a competition:

1. Log into `/admin/login`
2. **Quiz Control** → confirm readiness shows "Ready to publish" → **Publish Quiz**
3. When the event starts → **Start Competition** (this locks all questions)
4. Share the participant link
5. When time's up → **End Competition**
6. **Leaderboard** → **Refresh Leaderboard**, **Results** → **Export CSV** / **Sync to Google Sheets**

## 6. Environment Variables

### Backend (`backend/.env`)

| Variable | Notes |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Defaults to 4000 |
| `FRONTEND_URL` | Exact origin of your deployed frontend (for CORS) |
| `NODE_ENV` | `production` in deployment — controls cookie security flags |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Bootstraps the one admin account on boot |
| `SESSION_SECRET` | Long random string — used to sign the session cookie |
| `GOOGLE_SHEET_ID` | The spreadsheet ID from its URL |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | From your Google Cloud service account |
| `GOOGLE_PRIVATE_KEY` | Same service account's private key (keep the `\n` escapes as-is — the app un-escapes them) |
| `GOOGLE_SHEET_TAB_NAME` | Optional, defaults to `Sheet1` |

### Frontend (`frontend/.env`)

| Variable | Notes |
|---|---|
| `VITE_API_URL` | Your backend's `/api` base URL |

## 7. Google Sheets Setup

1. In Google Cloud Console, create a service account and download its JSON key.
2. Enable the Google Sheets API for the project.
3. Create a Google Sheet, and share it with the service account's email
   (as an Editor) — this is the step people usually miss.
4. Set `GOOGLE_SHEET_ID` (from the sheet's URL), `GOOGLE_SERVICE_ACCOUNT_EMAIL`,
   and `GOOGLE_PRIVATE_KEY` (from the JSON key) on the backend.
5. Use **Google Sheets → Sync to Google Sheets** in the admin dashboard.
   Only completed attempts sync; re-syncing updates existing rows by Unique
   ID instead of duplicating them.

## 8. Production Deployment

### Database
Provision PostgreSQL on any provider (Neon, Supabase, Render, Railway).
Copy its connection string into `DATABASE_URL`.

### Backend (Render/Railway)
1. Point the service at the `backend/` directory.
2. Build command: `npm install && npx prisma generate && npx prisma migrate deploy`
3. Start command: `npm run build && npm start`
4. Set all backend env vars from section 6, with `NODE_ENV=production` and
   `FRONTEND_URL` set to your deployed frontend's exact origin.
5. Run `npm run seed` once (via a one-off shell/job) to load the initial quiz.

### Frontend (Vercel)
1. Point the project at the `frontend/` directory.
2. Build command: `npm run build`, output directory: `dist`.
3. Set `VITE_API_URL` to your deployed backend's `/api` URL.

### Cross-domain cookies
Because the frontend and backend live on different domains in production,
the admin session cookie is set with `sameSite: "none"` + `secure: true`
automatically when `NODE_ENV=production` (see `backend/src/server.ts`). If
admin login succeeds but every subsequent admin request comes back
unauthenticated, double check `NODE_ENV` is actually set to `production` on
your backend host.

### Session store at scale
`express-session`'s default store is in-memory, which is fine for a single
backend instance (the normal case for a one-off symposium event). If you run
multiple backend instances behind a load balancer, swap in a shared store
(e.g. `connect-pg-simple` against the same Postgres database) so admin
sessions survive being routed to a different instance.

## 9. Load Testing (100+ concurrent participants)

A simple way to sanity-check concurrency before the real event, using
[`autocannon`](https://github.com/mcollina/autocannon) (no Docker needed):

```bash
npm install -g autocannon

# Simulate 150 concurrent participants hitting the start endpoint
autocannon -c 150 -d 30 -m POST \
  -H "Content-Type: application/json" \
  -b '{"name":"Load Test User"}' \
  https://your-backend.example.com/api/participants/start
```

Watch for: response times staying reasonable under load, and — most
importantly — that every returned `uniqueId` is actually unique (query
`SELECT uniqueId, COUNT(*) FROM participants GROUP BY uniqueId HAVING COUNT(*) > 1;`
afterwards; it should return zero rows). The Postgres-sequence-based ID
generator (`src/utils/uniqueId.ts`) is what keeps this safe under
concurrency without row locking.

For a fuller test, script the whole flow (start → quiz/start →
save-progress × 30 → submit) in [k6](https://k6.io/) or similar, and run it
against a staging database — never against production data.

## 10. Security Notes

- Correct answers are never included in any participant-facing API response.
- Admin routes require an authenticated session (`requireAdmin` middleware);
  login is rate-limited (10 attempts / 15 min) to slow brute-forcing.
- Google service-account credentials and the database connection string are
  read from environment variables only — never committed, never sent to the
  frontend.
- Participant IDs are generated via a native Postgres sequence, backed by a
  `UNIQUE` constraint, so they stay correct under concurrent signups.
- One attempt per participant per quiz is enforced at the database level
  (`@@unique([quizId, participantId])`), not just in application logic.
- The quiz timer is authoritative on the server (`expiresAt` stored per
  attempt); the frontend only displays a countdown, and submissions past the
  deadline are marked `EXPIRED` rather than trusted at face value.
- Anti-cheating (tab-switch/blur detection, copy/paste/right-click blocking)
  is browser-level and, like all browser-level controls, can be bypassed by
  a determined participant — it's meant to detect and discourage casual
  cheating, not guarantee its prevention.
- Stack traces are never returned to clients; all errors are logged
  server-side and mapped to plain-language messages.
