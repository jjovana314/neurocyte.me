# neurocyte.me

<p align="center">
	<img src="assets/logo.png" alt="neurocyte.me logo" width="200" />
</p>

**neurocyte.me** is a neurology patient-management platform that helps doctors record patient demographics, medical and family history, EDSS disability assessments, migraine logs, seizure logs, and nerve conduction studies - with CSV/PDF export and import for reporting and data portability.

---

## Features

- **Patient Records** – Create and manage patients (name, date of birth, gender, phone, email, free-text notes), each owned by the doctor who created it.
- **Medical History Tracking** – Log prior disorders per patient (disorder, description, diagnosis date, severity, medications).
- **Family History Tracking** – Log hereditary/neurological conditions in relatives (disease type, relation, severity, notes).
- **EDSS Disability Assessments** – Record Kurtzke Expanded Disability Status Scale assessments (7 functional-system scores + ambulation details); the total score is derived server-side by the dedicated `calculator` gRPC service, never supplied by the client.
- **Migraine Logs** – Track individual migraine episodes (date/time, duration, pain severity 1–10, aura, triggers, symptoms, medication taken, notes).
- **Seizure Logs** – Record seizure events with onset vector (focal aware, focal impaired awareness, generalized), motor features (tonic, clonic, atonic, automatisms), ictus start/end (active duration computed server-side), postictal recovery time, and environmental triggers (sleep deprivation, missed dose, high stress, illness).
- **Nerve Conduction Studies (NCS)** – Record per-nerve electrophysiology studies (nerve name, motor/sensory, conduction distance, distal and optional proximal stimulation-site latency/amplitude/duration, skin temperature). The client submits only the raw bedside measurements - every derived metric and diagnostic flag is computed server-side by the `calculator` gRPC service and stored alongside the inputs. Studies can also be bulk-imported from CSV.
- **CSV Export & Import** – Export all patient + history data to CSV, or bulk-import patients and their history from a CSV file in the same column layout.
- **PDF Reports** – Generate a per-patient PDF report (demographics, medical history, family history); sensitive fields (name, phone, email) are masked for the Support Engineer role.
- **Role-Based Access Control** – `Doctor`, `Support Engineer`, and `admin` roles with JWT-authenticated endpoints; doctors can only access patients they created, Support Engineers get a read-oriented, masked view across all patients.
- **Account Management** – Registration/login, forgot/reset password by email, and self-service account deactivation (confirmed by an admin via emailed link).

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, React Router, TanStack Query, Axios
- **Backend:** NestJS, TypeORM, MySQL, gRPC (`@nestjs/microservices`, `@grpc/grpc-js`) with generated TypeScript client stubs (`ts-proto`) for calling the calculator service
- **Calculator service:** Python, gRPC (`grpcio`) — hosts clinical scoring algorithms (EDSS scoring and nerve conduction study analysis) behind a language-agnostic RPC contract, called by the API over gRPC
- **Auth:** Passport (JWT strategy), bcrypt password hashing
- **Other:** pdfkit (PDF generation), Nodemailer (transactional email), nestjs-pino (structured logging)

---

## Installation & Setup

This repository contains the backend API (`api/`), the frontend application (`frontend/`), and the `calculator` gRPC service (`calculator/`) that the API calls out to for clinical scoring.

### 1. Prerequisites
- **Node.js** (v18+ recommended) and npm
- **Python 3** (for the `calculator` service)
- A running **MySQL** instance

### 2. Calculator Service Setup (Python + gRPC)
```sh
npm run setup:calculator   # creates calculator/.venv and installs grpcio/grpcio-tools
```

### 3. Backend Setup
Copy `api/env.example` to `api/.env` and fill in your database, JWT, and mail settings, then:
```sh
cd api
npm install
```

### 4. Generate the gRPC Stubs
The gRPC contract lives in `calculator/proto/calculator.proto`; `api/` keeps its own copy at `api/proto/calculator.proto` so it doesn't need filesystem access to the sibling `calculator/` directory at build/run time, build it locally, from the repo root, once steps 2 and 3 above are done:
```sh
npm run generate:proto
```
This generates Python stubs into `calculator/generated/` and TypeScript client stubs (via `ts-proto`) into `api/src/calculator/generated/`. Both the API and the calculator service will fail to start until this has been run at least once. Re-run it any time either `.proto` file changes (see `scripts/generate-proto.js`).

### 5. Finish Backend Setup
```sh
cd api
npm run migrate
npm run start:dev
```
`npm run migrate` applies any `.sql` files under `api/scripts/migrations` that haven't run yet (tracked in a `schema_migrations` table) — run it after every pull that adds a new migration file.

Roles (`Doctor`, `Support Engineer`, `admin`) can be seeded with `npx ts-node scripts/seed.ts` (see `api/scripts`).

**Start the calculator service before (or alongside) the API** — the API talks to it over gRPC and will error on any EDSS create/update until it's reachable:
```sh
npm run start:calculator   # from the repo root, starts the gRPC server on :50051
```
You should see `Calculator gRPC server listening on port 50051`. Or use `npm run start` from the repo root, which launches the calculator, API, and frontend together in one command.

The service listens on port `50051` by default (override with the `CALCULATOR_GRPC_PORT` env var). On the API side, `CALCULATOR_GRPC_URL` in `api/.env` must point at that same host:port (e.g. `localhost:50051`) — it has **no built-in default**, so it must be set explicitly.

### 6. Frontend Setup (React + Vite + TypeScript)
```sh
cd frontend
npm install
npm run dev
```

### 7. Docker (Backend)
The API and its MySQL database can be run in Docker instead of steps 3-5 above. The calculator service and frontend aren't containerized yet, so start the calculator on the host first (step 2/4), then from the repo root:
```sh
docker compose up --build
```
This builds `api/Dockerfile` (a multi-stage build that generates the gRPC stubs, compiles the API, then installs production-only dependencies) and starts it alongside a `mysql:8.4` container, applying pending migrations on every start before the API boots (see `api/docker-entrypoint.sh`). The API container reaches the host-run calculator via `host.docker.internal:50051`. It reuses `api/.env` for app secrets. See the comments in `docker-compose.yml` for details.

### Additional Scripts
- **Root convenience scripts** (from the repo root): `npm run start` (runs the calculator service, API, and frontend dev servers together), `npm run build` (builds API + frontend), `npm run setup:calculator` / `npm run start:calculator` (calculator service), `npm run generate:proto` (regenerate the gRPC stubs for both services from the `.proto` files)
- **Backend:** `npm run test` / `npm run test:cov` (unit tests), `npm run test:e2e` (end-to-end tests), `npm run lint`, `npm run format`
- **Calculator:** `npm run test:calculator` (from the repo root) runs the Python unit tests under `calculator/tests` with pytest
- **Frontend:** `npm run build` (type-check + production bundle), `npm run test` (unit tests, Vitest + React Testing Library) / `npm run test:watch`, `npm run lint`, `npm run preview` (serve the production build locally)

---

## API Overview

All `/patients` and most `/user` routes require a `Bearer` JWT obtained from `/auth/login` or `/auth/register`.

**Auth** (`/auth`): `POST /login`, `POST /register`, `POST /forgot-password`, `POST /reset-password`, `GET /roles`

**User** (`/user`): `DELETE /:id` (admin only), `POST /:id/request-deactivation`, `GET /deactivate/:token`

**Patients** (`/patients`):
| Method & Path | Purpose |
|---|---|
| `POST /` | Create a patient, optionally with an initial EDSS assessment (doctors only) |
| `GET /my-patients` | List patients (own patients for doctors, all patients for other roles) |
| `GET /:id` | Get a patient with full history, EDSS assessments, migraine logs, seizure logs, and nerve conduction studies |
| `PUT /:id` | Update notes, optionally adding a new EDSS assessment |
| `DELETE /:id` | Delete a patient and all associated records |
| `POST /:id/history` · `GET /:id/history` | Add / list medical history |
| `POST /:id/family-history` · `GET /:id/family-history` | Add / list family history |
| `GET /:id/edss` | List EDSS assessment history |
| `POST /:id/migraines` · `GET /:id/migraines` | Add / list migraine log entries |
| `POST /:id/seizures` · `GET /:id/seizures` | Add / list seizure log entries |
| `POST /:id/ncs-studies` · `GET /:id/ncs-studies` | Add / list nerve conduction studies; on add, the raw measurements are sent to the calculator service and the derived metrics + diagnostic flags are stored (returns the updated patient) |
| `POST /:id/ncs-studies/import` | Bulk-import nerve conduction studies for one patient from a CSV file (each row scored via the calculator service) |
| `GET /export/csv` | Export all accessible patients + history as CSV |
| `POST /import/csv` | Bulk-import patients + history from a CSV file |
| `GET /:id/export/pdf` | Generate a PDF report for one patient |

---

## Testing

The backend has unit tests (Jest) for the auth, user, and patient services/controllers, plus the EDSS scoring algorithm, and a minimal end-to-end smoke test. Run them from `api/`:
```sh
npm run test
npm run test:e2e
```

The frontend has unit tests (Vitest + React Testing Library), currently covering the medical history form/UI. Run them from `frontend/`:
```sh
npm run test
```
