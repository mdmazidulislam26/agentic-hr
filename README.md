# 🤖 Autonomous Agentic HR & Recruitment Microservices Ecosystem

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/NestJS-v10-red.svg)](https://nestjs.com/)
[![Python](https://img.shields.io/badge/FastAPI-v0.110-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-v14-black.svg)](https://nextjs.org/)
[![Database](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![Cache & Broker](https://img.shields.io/badge/Redis-7-red.svg)](https://redis.io/)
[![AI Engine](https://img.shields.io/badge/Groq-LPU%20Engine-orange.svg)](https://groq.com/)

An enterprise-grade, event-driven recruiting platform engineered with **NestJS**, **FastAPI**, **Next.js 14**, and **Autonomous AI Agents (Groq LLMs & Whisper-Large-v3)**. It orchestrates and automates the complete candidate lifecycle: smart ATS resume parsing, autonomous deadline-driven shortlisting, dynamic assessment generation with 10-minute anti-cheat waiting rooms, real-time AI voice/video interviews with speech synthesis, executive F2F scheduling, and GDPR-grade cascading data purges.

---

## 📑 Table of Contents

- [Key Architectural Highlights](#-key-architectural-highlights)
- [System Architecture (HLD)](#-system-architecture-hld)
- [Candidate Lifecycle State Machine](#-candidate-lifecycle-state-machine)
- [Microservices Decomposition](#-microservices-decomposition)
- [Full Tech Stack Matrix](#-full-tech-stack-matrix)
- [Directory Structure](#-directory-structure)
- [Quickstart with Docker Compose](#-quickstart-with-docker-compose)
- [Environment Variables Guide](#-environment-variables-guide)
- [Zero-Junk Retention & GDPR Cascading Purge](#-zero-junk-retention--gdpr-cascading-purge)
- [API Reference](#-api-reference)
- [License](#-license)

---

## 🌟 Key Architectural Highlights

- **Sub-Second Semantic ATS Screening:** Uses `PyMuPDF` and `Groq LLM Engine` to parse and semantically evaluate resumes against Job Descriptions in memory (< 1.2s). Resumes scoring below the threshold (e.g., < 75%) are dropped immediately without database insertion, saving server storage.
- **Autonomous Deadline & Cutoff Watcher:** Background NestJS Cron detects deadline expiration, analyzes score distribution curves, and calculates an optimal cutoff percentage ($X\%$) recommended to the HR recruiter.
- **Dynamic Assessment & 10-Min Waiting Room Portal:** Generates unique, multi-set MCQ tests tailored to job specifications with strict per-question countdown timers and 6-character single-use passwords. Eliminates the *"Thundering Herd / Flash Crowd"* problem.
- **Real-Time AI Voice & Video Interviewer:** Interactive WebSockets + MediaRecorder pipeline utilizing **Groq Whisper-Large-v3** for low-latency Speech-to-Text and **Web Speech API** for AI speech output. Dynamically challenges candidates on their resume projects and evaluates Technical (50%), Communication (30%), and Behavioral (20%) scores.
- **Pre-Interview Device Check:** Candidate enters the room 10 minutes prior to test their webcam and microphone before the autonomous session initiates.
- **Executive Final Face-to-Face (F2F) Round:** HR recruiter can schedule in-person or virtual Google Meet/Zoom interviews and dispatch official branded appointment letters with 1-click.
- **GDPR-Compliant Cascading Data Purge:** One-click hard purge powered by PostgreSQL `ON DELETE CASCADE`, wiping all transient candidate telemetry, transcripts, and evaluation logs upon recruitment completion.

---

## 🏗️ System Architecture (HLD)

```text
                              [ Client Browser: Next.js 14 ]
                                             │
                                             │ (HTTPS / WebSockets)
                                             ▼
                             [ API Gateway: Nginx (Port 80) ]
                                             │
      ┌──────────────────────┬───────────────┴───────────────┬──────────────────────┐
      │                      │                               │                      │
      ▼                      ▼                               ▼                      ▼
[ Job & Auth ]        [ ATS Screener ]              [ Assessment ]          [ AI Interview ]
 (NestJS :8001)        (FastAPI :8002)               (FastAPI :8003)         (FastAPI :8004)
      │                      │                               │                      │
      │ (Prisma ORM)         │ (PyMuPDF / Groq)              │ (Dynamic MCQs)       │ (Whisper STT / Web Speech)
      │                      │                               │                      │
      └──────────────────────┼───────────────────────────────┴──────────────────────┘
                             │
                             ▼
                    [ Redis Message Bus ]
                             │
                             ▼
             [ Notification & Scheduler Worker ] (NestJS :8005)
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
     [ PostgreSQL 15 ]             [ Nodemailer / SMTP Email ]

```

## 🔄 Candidate Lifecycle State Machine

```text
[Candidate Submits Form & CV]
               │
               ▼
   [In-Memory ATS Screening] ────(Score < Threshold)────► [DROPPED_UNSAVED] (Exit)
               │
               ▼ (Score >= Threshold)
        [ATS_QUALIFIED]
               │
               ▼ (10-Min Waiting Room & Temporary Password)
        [EXAM_INVITED] ──────────(Fail / Absent)────────► [PURGED] (Exit)
               │
               ▼ (Score >= PassMark)
        [EXAM_PASSED]
               │
               ▼ (Candidate Selects Custom Date & Time)
     [SLOT_BOOKING_PENDING] ──► [INTERVIEW_SCHEDULED]
               │
               ▼ (10-Min Device Test & Live AI Interview)
     [INTERVIEW_COMPLETED]
               │
               ├──► [SELECTED_FOR_F2F] ────► [Executive Appointment Letter Emailed]
               └──► [REJECTED]
                         │
                         ▼ (Post-Recruitment Purge)
                  [ALL_DATA_PURGED] (Zero Footprint)
```

---

## 📦 Microservices Decomposition

| Microservice                | Port   | Framework               | Primary Responsibility                                                                    |
| :-------------------------- | :----- | :---------------------- | :---------------------------------------------------------------------------------------- |
| **`api-gateway`**           | `80`   | Nginx                   | Reverse proxy, path routing, and WebSocket connection upgrade handling (wss://).                   |
| **`job-auth-service`**      | `8001` | NestJS / Prisma         | HR authentication, RBAC, Job management, F2F scheduling, and email dispatches.                    |
| **`ats-screening-service`** | `8002` | FastAPI / Python        | In-memory PDF text extraction (PyMuPDF) and semantic resume matching via Groq LLMs.            |
| **`assessment-service`**    | `8003` | FastAPI / Python        | Dynamic multi-set question generator, timed exam portal, and automated grading.           |
| **`ai-interview-service`**  | `8004` | FastAPI / WebSockets    | Live webcam session, Groq Whisper-v3 Speech-to-Text, and AI Executive Scorecard rating.                |
| **`notification-worker`**   | `8005` | NestJS / BullMQ         | Deadline watcher (Cron), cutoff optimization agent, and transactional email queue. |
| **`web-frontend`**          | `3000` | Next.js 14 (App Router) | Responsive candidate career portal, secure exam waiting rooms, and HR analytics console.                          |

---

## 🛠️ Free-Tier Tech Stack Matrix

- **Backend Logic:** TypeScript (NestJS 10) & Python 3.11 (FastAPI).
- **Frontend Client:** Next.js 14 (App Router), React 18, TailwindCSS, Lucide Icons.
- **Relational Data Store:** PostgreSQL 15 accessed via Prisma ORM & Async SQLAlchemy (asyncpg).
- **Message Broker & Cache:** Redis 7.
- **LLM Reasoning & STT:** [Groq Cloud LPU Engine](https://console.groq.com) & `whisper-large-v3`.
- **Text-to-Speech:** Browser Web Speech API (`SpeechSynthesis`).
- **Email Delivery:**  SMTP (Nodemailer) & Resend.
- **Containerization:** Docker & Docker Compose.

---

## 📂 Directory Structure

```text
agentic-hr-platform/
├── .github/workflows/ci-cd.yml      # Automated build & test pipeline
├── api-gateway/                      # Nginx reverse proxy configuration
│   ├── Dockerfile
│   └── nginx.conf
├── services/
│   ├── job-auth-service/             # [NestJS] Core auth, jobs, slot booking, purge
│   │   ├── prisma/schema.prisma
│   │   ├── src/jobs/
│   │   └── Dockerfile
│   ├── ats-screening-service/        # [FastAPI] PDF extraction & Groq ATS matcher
│   │   ├── app/services/
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   ├── assessment-service/           # [FastAPI] Dynamic assessment architect
│   │   ├── app/agents/
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   ├── ai-interview-service/         # [FastAPI] WebSockets & Whisper STT agent
│   │   ├── app/audio/
│   │   ├── app/agents/
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   └── notification-worker-service/  # [NestJS] Cron scheduler & cutoff predictor
│       ├── src/cron/
│       ├── src/agents/
│       └── Dockerfile
├── web-frontend/                     # [Next.js 14] Fullstack Web Client
│   ├── src/app/
│   ├── tailwind.config.js
│   └── Dockerfile
├── docker-compose.yml                # Master orchestrator
├── .env.example                      # Central credentials template
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🚀 Quickstart with Docker Compose

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose installed.
- Free API keys from [Groq Console](https://console.groq.com).

### 1. Clone & Configure

```bash
git clone https://github.com/mdmazidulislam26/agentic-hr-.git
cd agentic-hr
cp .env.example .env
```

### 🔧 Environment Variables Guide

Edit `.env` with your credentials:

```env
DATABASE_URL="postgresql://hr_admin:hr_secure_password@postgres-db:5432/agentic_hr_db?schema=public"
REDIS_HOST="redis-broker"
REDIS_PORT=6379
JWT_SECRET="super-secret-jwt-key-agentic-hr-2026"
GROQ_API_KEY="gsk_your_groq_api_key_here"
SMTP_EMAIL="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
RESEND_API_KEY="re_optional_key"
```

### 2. Launch the Microservices Ecosystem

```bash
docker compose up -d --build
```

### 3. Sync Database Tables

```bash
docker compose exec job-auth-service npx prisma db push
```

### 4. Verify System Endpoints

- **Web Frontend Application:** `http://localhost`
- **Nginx Unified Gateway:** `http://localhost/api/v1`
- **PostgreSQL Database:** `localhost:5432`
- **Redis Message Broker:** `localhost:6379`

---

## 🔐 Zero-Junk Retention & GDPR Cascading Purge

To prevent cloud database bloat on free serverless plans:

1. **In-Memory Rejection:** Applicants matching below threshold criteria are immediately served an evaluation summary and dropped in memory. No persistent database record is created.
2. **Intermediate Pruning:** Applicants failing assessment tests or missing the scheduled window are cleared using batch transactions.
3. **Cascading Post Purge:** Once hiring completes, the HR Recruiter invokes the purge endpoint with explicit verification token `PURGE_ALL_DATA_<jobId>`. The database triggers `ON DELETE CASCADE` across all child entities.

```sql
ALTER TABLE "CandidateApplication"
ADD CONSTRAINT "fk_job_cascade"
FOREIGN KEY ("jobId") REFERENCES "JobPost"("id")
ON DELETE CASCADE;
```

This wipes all candidate profiles, CV extractions, exam submissions, audio transcripts, and AI judge reports in a single atomic transaction.

---

## 📡 API Reference

### ATS Resume Screening

- `POST /api/v1/ats/evaluate` — Upload PDF resume for instant in-memory matching.

### Job Management & Cutoff

- `POST /api/v1/jobs`— Create new job requisition with custom ATS thresholds.
- `POST /api/v1/jobs/:jobId/invite-exam` — Dispatch exam links and unique 6-character temporary passwords.
- `POST /api/v1/jobs/:jobId/set-passmark-and-purge` — Set cutoff pass mark and delete unqualified candidates.

### Assessment Portal

- `POST /api/v1/jobs/exam/verify-access` — Enforce 10-minute waiting room rule & verify exam password.
- `POST /api/v1/jobs/exam/submit-answers` — Grade exam and lock session permanently.

### AI Live Interview

- `POST /api/v1/jobs/interview/book-custom-slot` — Reserve candidate-selected interview date & time.
- `GET /api/v1/jobs/interview/check-access/:candidateId` — Validate slot window, 10-min device check, and expiration.
- `WS /api/v1/interviews/session/:candidateId` — Bi-directional WebSocket stream for live video/audio interview questioning, Whisper transcription, and scorecard generation.

### Selection & F2F

- `GET /api/v1/jobs/:jobId/leaderboard` — Access candidate leaderboard sorted by ATS score, Exam results, and AI interview scorecard.
- `POST /api/v1/jobs/:jobId/select-f2f` — Dispatch executive in-person or virtual F2F appointment letters.
- `DELETE /api/v1/jobs/:jobId/purge-all` — Irreversibly wipe all telemetry and candidate records.
---

## 📄 License

Distributed under the MIT License. Designed and engineered for enterprise recruitment automation showcase.
