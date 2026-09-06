# MediKiosk

**AI-assisted OPD registration, clinical history-taking and queue management for Indian hospitals.**

A patient walks up to a kiosk, registers in their own language, answers a structured
history interview by voice or touch, scans any documents they brought, and receives a
real OPD token. Before their number is called, the doctor already has a compiled draft
summary with deterministic red flags on screen.

Built for Smart India Hackathon.

---

## What it does

**For the patient**
- Registration in 10 languages, with large touch targets designed for a shared public terminal
- Nearby hospital discovery from live OpenStreetMap data — real facilities, real distances
- A 12-question clinical interview with voice input (Web Speech API) and on-device OCR (Tesseract.js)
- A genuine queue token, with a live position that updates the instant the doctor calls them

**For the doctor**
- A shared queue board — a patient registering on any kiosk appears immediately, on every device
- A per-patient chart: compiled draft summary, source-tagged answers, scanned documents, audit trail
- Deterministic red flags (chest pain, breathlessness, bleeding, syncope, severity, age) — each with a written reason
- Edit any section, then verify and sign; a signed chart becomes immutable

**For administration**
- Live OPD load, throughput, average consultation time — all real aggregate queries
- Staff directory (never any credentials) and a paginated, append-only audit trail
- Kiosk fleet status

---

## Architecture

```
Medikiosk/
├── src/                  React 19 (JavaScript, JSX) + Vite 7 + Tailwind v4   (kiosk / doctor / admin SPA)
│   ├── pages/            24 screens across patient, doctor and admin
│   ├── services/         the only place that talks to the API
│   ├── components/ui/    shared primitives (Button, Card, Dialog, Toast, …)
│   ├── hooks/            useQueueSocket — live queue subscriptions
│   └── i18n/             10-language dictionary
│
└── apps/api/             Node 20 + Express (JavaScript) + Prisma + MySQL
    ├── prisma/           schema, migrations, seed, optional demo data
    └── src/
        ├── routes/       thin — validation + auth guards only
        ├── controllers/  request/response shaping
        ├── services/     the domain logic (queue, summary, roster, audit)
        ├── middleware/   auth, validation, rate limiting, error handling
        ├── validators/   Zod schemas, one per request shape
        └── realtime/     Socket.IO, read-only broadcast
```

### Why these choices

| Decision | Reason |
| --- | --- |
| **Express over NestJS** | ~25 endpoints. Nest's module/DI overhead would exceed the domain it organises. |
| **MySQL over MongoDB** | The core invariant is *one token number per doctor per day*. A unique index enforces that in the database; a document store would push it into application code, where the original prototype's bug lived. |
| **Prisma** | Versioned migrations and a generated client keep the API and the schema honest with each other, and make the data model reviewable. |
| **Zod** | Same schema shapes validate on both sides, so the client and server can't drift. |
| **httpOnly cookie, not localStorage** | The prototype gated access on a localStorage boolean. On a shared public kiosk, a token JS can read is a token an XSS can steal. |
| **Socket.IO** | The demo *is* the live update. Polling alone can't show a patient's screen changing the moment the doctor clicks Call. The socket is read-only — every mutation still goes through the authenticated REST API. |
| **TanStack Query** | Replaced ~20 hand-rolled `useEffect` + loading + `alive` blocks, and gave every screen retry/refetch semantics for free. |
| **OCR stays in the browser** | The patient's document never leaves the device. Only extracted text and a downscaled thumbnail are stored. |
| **OSM lookup stays in the browser** | Already resilient (three Overpass mirrors, Nominatim + Photon fallback, 10-minute cache). Proxying it would add a failure point and buy nothing. |
| **HashRouter kept** | Deliberate: it lets the single-file kiosk build run from `file://` on an offline terminal. |
| **Deterministic red flags, not an LLM** | In a clinical setting an unexplainable warning is worse than no warning. Every flag carries the rule and reason that produced it. |

---

## Running it locally

**Requirements:** Node 20+, MySQL 8+

### 1. Database and API

```bash
cd apps/api
cp .env.example .env          # then set DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev        # create the schema
npm run seed                  # staff accounts + the 19-doctor roster
npm run demo                  # optional: a morning OPD already in progress
npm run dev                   # http://localhost:4000
```

The seed prints the generated staff passwords **once**. Pin them by setting
`SEED_DOCTOR_PASSWORD` / `SEED_ADMIN_PASSWORD` in `.env` before running it.

### 2. Frontend

```bash
cd ../..                      # repo root
cp .env.example .env.local
npm install
npm run dev                   # http://localhost:5173
```

The dev server proxies `/api` and `/socket.io` to the backend, so the browser only
ever calls same-origin relative URLs — no hardcoded hosts, and the auth cookie works
without CORS workarounds.

### Demo walkthrough

1. **Patient** — open `/`, choose *New registration*, and go through problem → location →
   hospital → department → doctor → token → history → documents → review.
2. **Doctor** — open `/#/doctor/dashboard` in a second browser (or another device) and sign
   in as `doctor`. The patient you just registered is on the board.
3. **The moment worth showing** — put the patient's queue screen on a phone and the doctor's
   board on a laptop. Click **Call**. The phone changes to *Your turn* with no refresh.
4. **Admin** — `/#/admin` as `admin` for live load, the staff directory and the audit trail.

---

## Testing

```bash
cd apps/api && npm test      # 28 integration tests against a real database
```

Covering: authentication and role boundaries, the API envelope, PHI minimisation,
resumable interviews, red-flag rules, chart ownership, sign-off immutability, the queue
state machine, and **12 simultaneous token requests to one doctor** — the concurrency case
the original hardcoded `A-127` got wrong.

---

## Security

- **bcrypt** (cost 12) password hashes; no endpoint returns a credential, and the admin
  dashboard no longer prints them
- **JWT in an httpOnly cookie**, re-validated against the database on every request, so a
  deactivated account loses access immediately
- **Role guards server-side** — a doctor cannot open a chart from another doctor's queue
- **Rate limiting** on login (10 per 10 min, brute-force) and on writes
- **Zod validation** on every request; controllers cannot read an unvalidated field
- **PHI minimisation** — mobile numbers stored as a SHA-256 hash plus the last four digits;
  the raw number is never persisted and never returned
- **Sessions expire** (default 12 h), and returning to the public home screen ends any staff
  session on that terminal
- **Helmet**, strict CORS, and an error handler that never leaks a stack trace or a Prisma
  message to the client

---

## Environment variables

Both `.env.example` files list every variable with placeholder values only. No secret is
committed, and nothing sensitive is exposed to the browser — only `VITE_*` variables reach
the bundle, and none of them are credentials.

**Backend** (`apps/api/.env`): `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`,
`NODE_ENV`, `CORS_ORIGIN`, `SESSION_TTL_HOURS`, `COOKIE_SECURE`

**Frontend** (`.env.local`): `VITE_API_URL`, `VITE_API_PROXY`, `VITE_SOCKET_URL`

---

## Building for production

```bash
npm run build                 # standard SPA build -> dist/
npm run build:kiosk           # single-file build for an offline terminal

cd apps/api
npx prisma migrate deploy && npm start
```

Set `COOKIE_SECURE=true`, a strong `JWT_SECRET`, and an explicit `CORS_ORIGIN` in
production. Serving the SPA and the API from the same origin keeps the auth cookie simple.

---

## API

All responses share one envelope:

```jsonc
{ "success": true,  "data": { }, "message": "…" }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [ ] } }
```

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | — | Staff sign-in (rate limited) |
| POST | `/api/auth/logout` | — | End the session |
| GET | `/api/auth/me` | staff | Restore the session on reload |
| POST | `/api/sessions` | — | Register a patient at a kiosk |
| GET/PATCH | `/api/sessions/:id` | — | Read / update the visit |
| GET | `/api/sessions/questions` | — | The history questionnaire |
| GET | `/api/sessions/:id/answers` | — | Resume the interview |
| PUT | `/api/sessions/:id/answers/:qid` | — | Save one answer |
| GET/POST | `/api/sessions/:id/documents` | — | Scanned document text |
| DELETE | `/api/documents/:id` | — | Remove a document |
| GET | `/api/sessions/:id/summary` | — | Compile the draft |
| POST | `/api/sessions/:id/submit` | — | Send to the doctor |
| POST | `/api/hospitals/sync` | — | Link the chosen OSM facility |
| GET | `/api/departments` · `/api/doctors` · `/api/doctors/:id` | — | Facility roster |
| POST | `/api/tokens` | — | Issue a token (transactional) |
| GET | `/api/tokens/:id` | — | Live queue position |
| GET | `/api/queue` · `/api/queue/metrics` | staff | The doctor's board |
| POST | `/api/queue/:id/:action` | staff | `call` · `start` · `complete` · `absent` |
| GET | `/api/charts/:tokenId` | staff | Full patient chart |
| PATCH | `/api/charts/:id/summary` | staff | Edit the draft |
| POST | `/api/charts/:id/verify` | staff | Verify and sign |
| GET | `/api/admin/overview` · `/staff` · `/audit` | admin | Operations |
| GET | `/health` | — | Liveness + DB check |

**Socket.IO** — clients emit `subscribe:doctor` or `subscribe:token`; the server emits
`queue:changed` and `token:changed`.

---

## Known limitations

- Structured lab-value extraction is not implemented, so the Lab results tab is empty by
  design rather than populated with invented numbers.
- Departments and consultants are provisioned per facility from a curated roster: OSM
  publishes that a hospital exists, but no public API exposes a real OPD roster.
- The recall-at-the-desk button notifies the UI only; wiring it to hall hardware is
  deployment-specific.
#   B a c k e n d - m e d i k i o s k  
 