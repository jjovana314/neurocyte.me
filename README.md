# neurocyte.me

<p align="center">
	<img src="assets/logo.png" alt="neurocyte.me logo" width="200" />
</p>

**neurocyte.me** is a neurology patient-management platform that helps doctors record patient demographics, medical and family history, EDSS disability assessments, migraine logs, and seizure logs — with CSV/PDF export and import for reporting and data portability.

---

## 🚀 Features

- **Patient Records** – Create and manage patients (name, date of birth, gender, phone, email, free-text notes), each owned by the doctor who created it.
- **Medical History Tracking** – Log prior disorders per patient (disorder, description, diagnosis date, severity, medications).
- **Family History Tracking** – Log hereditary/neurological conditions in relatives (disease type, relation, severity, notes).
- **EDSS Disability Assessments** – Record Kurtzke Expanded Disability Status Scale assessments (7 functional-system scores + ambulation details); the total score is derived server-side by the dedicated `calculator` gRPC service, never supplied by the client.
- **Migraine Logs** – Track individual migraine episodes (date/time, duration, pain severity 1–10, aura, triggers, symptoms, medication taken, notes).
- **Seizure Logs** – Record seizure events with onset vector (focal aware, focal impaired awareness, generalized), motor features (tonic, clonic, atonic, automatisms), ictus start/end (active duration computed server-side), postictal recovery time, and environmental triggers (sleep deprivation, missed dose, high stress, illness).
- **CSV Export & Import** – Export all patient + history data to CSV, or bulk-import patients and their history from a CSV file in the same column layout.
- **PDF Reports** – Generate a per-patient PDF report (demographics, medical history, family history); sensitive fields (name, phone, email) are masked for the Support Engineer role.
- **Role-Based Access Control** – `Doctor`, `Support Engineer`, and `admin` roles with JWT-authenticated endpoints; doctors can only access patients they created, Support Engineers get a read-oriented, masked view across all patients.
- **Account Management** – Registration/login, forgot/reset password by email, and self-service account deactivation (confirmed by an admin via emailed link).

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite, React Router, TanStack Query, Axios
- **Backend:** NestJS, TypeORM, MySQL
- **Calculator service:** Python, gRPC (`grpcio`) — hosts clinical scoring algorithms (currently EDSS) behind a language-agnostic RPC contract, called by the API over gRPC
- **Auth:** Passport (JWT strategy), bcrypt password hashing
- **Other:** pdfkit (PDF generation), Nodemailer (transactional email), nestjs-pino (structured logging)

---

## 📦 Installation & Setup

This repository contains the backend API (`api/`), the frontend application (`frontend/`), and the `calculator` gRPC service (`calculator/`) that the API calls out to for clinical scoring.

### 1. Prerequisites
- **Node.js** (v18+ recommended) and npm
- **Python 3** (for the `calculator` service)
- A running **MySQL** instance

### 2. Calculator Service Setup (Python + gRPC)
```sh
npm run setup:calculator   # creates calculator/.venv and installs grpcio/grpcio-tools
npm run start:calculator   # starts the gRPC server on :50051
```
The API talks to this service over gRPC using the contract in `calculator/proto/calculator.proto`; the generated stubs live in `calculator/generated/` (regenerate them with `grpc_tools.protoc` if the `.proto` changes — see the comment at the top of that file). The API's `CALCULATOR_GRPC_URL` env var (default `localhost:50051`) points at it — the calculator service must be running before the API can create/update EDSS assessments.

### 3. Backend Setup
Copy `api/env.example` to `api/.env` and fill in your database, JWT, and mail settings (`DATABASE_URL`, `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_PORT`, `SECRET_KEY`, `ACCESS_TOKEN_TIME`, `REFRESH_TOKEN_TIME`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`, `APP_URL`, `FRONTEND_URL`, `CALCULATOR_GRPC_URL`), then:
```sh
cd api
npm install
npm run migrate
npm run start:dev
```
`npm run migrate` applies any `.sql` files under `api/scripts/migrations` that haven't run yet (tracked in a `schema_migrations` table) — run it after every pull that adds a new migration file.

Roles (`Doctor`, `Support Engineer`, `admin`) can be seeded with `npx ts-node scripts/seed.ts` (see `api/scripts`).

### 4. Frontend Setup (React + Vite + TypeScript)
```sh
cd frontend
npm install
npm run dev
```

### 💡 Additional Scripts
- **Root convenience scripts** (from the repo root): `npm run start` (runs the calculator service, API, and frontend dev servers together), `npm run build` (builds API + frontend), `npm run setup:calculator` / `npm run start:calculator` (calculator service)
- **Backend:** `npm run test` / `npm run test:cov` (unit tests), `npm run test:e2e` (end-to-end tests), `npm run lint`, `npm run format`
- **Frontend:** `npm run build` (type-check + production bundle), `npm run lint`, `npm run preview` (serve the production build locally)

---

## 📡 API Overview

All `/patients` and most `/user` routes require a `Bearer` JWT obtained from `/auth/login` or `/auth/register`.

**Auth** (`/auth`): `POST /login`, `POST /register`, `POST /forgot-password`, `POST /reset-password`, `GET /roles`

**User** (`/user`): `DELETE /:id` (admin only), `POST /:id/request-deactivation`, `GET /deactivate/:token`

**Patients** (`/patients`):
| Method & Path | Purpose |
|---|---|
| `POST /` | Create a patient, optionally with an initial EDSS assessment (doctors only) |
| `GET /my-patients` | List patients (own patients for doctors, all patients for other roles) |
| `GET /:id` | Get a patient with full history, EDSS assessments, migraine logs, and seizure logs |
| `PUT /:id` | Update notes, optionally adding a new EDSS assessment |
| `DELETE /:id` | Delete a patient and all associated records |
| `POST /:id/history` · `GET /:id/history` | Add / list medical history |
| `POST /:id/family-history` · `GET /:id/family-history` | Add / list family history |
| `GET /:id/edss` | List EDSS assessment history |
| `POST /:id/migraines` · `GET /:id/migraines` | Add / list migraine log entries |
| `POST /:id/seizures` · `GET /:id/seizures` | Add / list seizure log entries |
| `GET /export/csv` | Export all accessible patients + history as CSV |
| `POST /import/csv` | Bulk-import patients + history from a CSV file |
| `GET /:id/export/pdf` | Generate a PDF report for one patient |

---

## 🧪 Testing

The backend has unit tests (Jest) for the auth, user, and patient services/controllers, plus the EDSS scoring algorithm, and a minimal end-to-end smoke test. Run them from `api/`:
```sh
npm run test
npm run test:e2e
```
