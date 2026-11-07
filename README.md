# 🤖 Autonomous Agentic HR & Recruitment Microservices Ecosystem

[![CI/CD Pipeline](https://github.com/your-username/agentic-hr-platform/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/your-username/agentic-hr-platform/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/NestJS-v10-red.svg)](https://nestjs.com/)
[![Python](https://img.shields.io/badge/FastAPI-v0.110-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-v14-black.svg)](https://nextjs.org/)
[![Database](https://img.shields.io/badge/PostgreSQL-Neon.tech-blue.svg)](https://neon.tech/)
[![AI Engine](https://img.shields.io/badge/Groq-Llama--3.3%20%26%20Whisper--v3-orange.svg)](https://groq.com/)

An enterprise-grade, event-driven recruiting platform engineered with **NestJS**, **FastAPI**, **Next.js 14**, and **Autonomous AI Agents (Groq Llama-3.3 & Whisper-Large-v3)**. It orchestrates and automates the complete candidate lifecycle: smart ATS resume parsing, autonomous deadline-driven shortlisting, dynamic assessment generation, real-time AI video/audio interviews, and GDPR-grade cascading data purges—running entirely on **100% free cloud tiers**.

---

## 📑 Table of Contents
- [Key Architectural Highlights](#-key-architectural-highlights)
- [System Architecture (HLD)](#-system-architecture-hld)
- [Candidate Lifecycle State Machine](#-candidate-lifecycle-state-machine)
- [Microservices Decomposition](#-microservices-decomposition)
- [Free-Tier Tech Stack Matrix](#-free-tier-tech-stack-matrix)
- [Directory Structure](#-directory-structure)
- [Quickstart with Docker Compose](#-quickstart-with-docker-compose)
- [Environment Variables Guide](#-environment-variables-guide)
- [Zero-Junk Retention & GDPR Cascading Purge](#-zero-junk-retention--gdpr-cascading-purge)
- [API Reference](#-api-reference)
- [License](#-license)

---

## 🌟 Key Architectural Highlights

- **Sub-Second Semantic ATS Screening:** Uses `PyMuPDF` and `Groq (Llama-3.3-70B)` to parse and semantically evaluate resumes against Job Descriptions in memory (< 1.2s). Resumes scoring below the threshold (e.g., < 75%) are dropped immediately without database insertion, saving server storage.
- **Autonomous Deadline & Cutoff Watcher:** Background NestJS Cron detects deadline expiration, analyzes score distribution curves, and calculates an optimal cutoff percentage ($X\%$) recommended to the HR recruiter.
- **Dynamic Assessment & Anti-Cheating Portal:** Generates unique, multi-set MCQ tests tailored to job specifications with strict per-question countdown timers. Candidates who fail or miss the exam window are automatically pruned.
- **Real-Time AI Video & Audio Interviewer:** Interactive WebSockets + MediaRecorder pipeline utilizing **Groq Whisper-Large-v3** for low-latency Speech-to-Text. The agent dynamically challenges candidates on their specific resume projects, job criteria, and HR-specified questions while evaluating technical articulation and behavioral posture.
- **GDPR-Compliant Cascading Data Purge:** One-click hard purge powered by PostgreSQL `ON DELETE CASCADE`, wiping all transient candidate telemetry, transcripts, and evaluation logs upon recruitment completion.

---

## 🏗️ System Architecture (HLD)

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
      │ (Prisma ORM)         │ (PyMuPDF / Groq)              │ (Dynamic MCQs)       │ (Whisper STT / Llama-3)
      │                      │                               │                      │
      └──────────────────────┼───────────────────────────────┴──────────────────────┘
                             │
                             ▼
               [ Upstash Redis / Message Bus ]
                             │
                             ▼
             [ Notification & Scheduler Worker ] (NestJS :8005)
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
   [ PostgreSQL (Neon.tech) ]     [ Resend Transactional Email ]

---

## 🔄 Candidate Lifecycle State Machine
[Candidate Submits Form & CV]
               │
               ▼
   [In-Memory ATS Screening] ────(Score < 75%)────► [DROPPED_UNSAVED] (Exit)
               │
               ▼ (Score >= 75%)
        [ATS_QUALIFIED]
               │
               ▼ (Deadline Reached via Cron)
   [Cutoff Engine (Top X% / Y%)] ──(Outside Cutoff)──► [PURGED] (Exit)
               │
               ▼
        [EXAM_SCHEDULED] ─────────(Fail / Absent)────► [PURGED] (Exit)
               │
               ▼ (Passed Assessment)
     [SLOT_BOOKING_PENDING]
               │
               ▼ (Candidate Chooses 10/15/20 min slot)
     [INTERVIEW_SCHEDULED]
               │
               ▼ (Webcam Live Session + Whisper STT)
     [INTERVIEW_COMPLETED]
               │
               ├──► [SELECTED_FOR_F2F] ────► [Face-to-Face Invite Sent]
               └──► [REJECTED]
                         │
                         ▼ (Post-Recruitment Authorization)
                  [ALL_DATA_PURGED] (Zero Footprint)
                  
---

## 📦 Microservices Decomposition

| Microservice | Port | Framework | Primary Responsibility |
| :--- | :--- | :--- | :--- |
| **`api-gateway`** | `80` | Nginx | Reverse proxy, path routing, and WebSocket connection upgrade handling. |
| **`job-auth-service`** | `8001` | NestJS / Prisma | HR authentication, RBAC, Job management, and cascading delete actions. |
| **`ats-screening-service`** | `8002` | FastAPI / Python | In-memory PDF text extraction and semantic resume matching via Groq Llama-3.3. |
| **`assessment-service`** | `8003` | FastAPI / Python | Dynamic multi-set question generator, timed exam portal, and automated grading. |
| **`ai-interview-service`** | `8004` | FastAPI / WebSockets | Live webcam session, Groq Whisper-v3 Speech-to-Text, and AI Judge scoring. |
| **`notification-worker`** | `8005` | NestJS / BullMQ | Deadline watcher (Cron), cutoff optimization agent, and Resend transactional email queue. |
| **`web-frontend`** | `3000` | Next.js 14 (App Router) | Responsive candidate career portal and HR analytics leaderboard. |

---

## 🛠️ Free-Tier Tech Stack Matrix

- **Backend Logic:** TypeScript (NestJS 10) & Python 3.11 (FastAPI).
- **Frontend Client:** Next.js 14, React 18, TailwindCSS, Lucide React.
- **Relational Data Store:** PostgreSQL Serverless ([Neon.tech](https://neon.tech)) accessed via Prisma ORM & SQLAlchemy.
- **Event Bus & Caching:** Serverless Redis ([Upstash](https://upstash.com)).
- **LLM Reasoning & STT:** [Groq Cloud](https://console.groq.com) running `llama-3.3-70b-versatile` & `whisper-large-v3`.
- **Email Delivery:** [Resend](https://resend.com) (100 free transactional emails/day).
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
- Free API keys from [Groq Console](https://console.groq.com) and [Resend](https://resend.com).

### 1. Clone & Configure
```bash
git clone https://github.com/your-username/agentic-hr-platform.git
cd agentic-hr-platform
cp .env.example .env
```

Edit `.env` with your credentials:
```env
DATABASE_URL="postgresql://hr_admin:hr_secure_password@postgres-db:5432/agentic_hr_db?schema=public"
REDIS_HOST="redis-broker"
REDIS_PORT=6379
JWT_SECRET="super-secret-jwt-key"
GROQ_API_KEY="gsk_your_groq_api_key_here"
RESEND_API_KEY="re_your_resend_api_key_here"
```

### 2. Launch the Microservices Ecosystem
```bash
docker compose up --build
```

### 3. Verify System Endpoints
- **Web Frontend Application:** `http://localhost`
- **Nginx Unified Gateway:** `http://localhost/api/v1`
- **PostgreSQL Database:** `localhost:5432`
- **Redis Message Broker:** `localhost:6379`

---

## 🔐 Zero-Junk Retention & GDPR Cascading Purge

To prevent cloud database bloat on free serverless plans:
1. **In-Memory Rejection:** Applicants matching below threshold criteria are immediately served an evaluation summary and dropped in memory. No persistent database record is created.
2. **Intermediate Pruning:** Applicants failing assessment tests or missing the scheduled window are cleared using batch queries.
3. **Cascading Post Purge:** Once hiring completes, the HR Recruiter invokes the purge endpoint with explicit verification token `PURGE_ALL_DATA_<jobId>`. The database triggers `ON DELETE CASCADE` across all child entities:

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
- `POST /api/v1/ats/evaluate`
  - Upload `multipart/form-data` containing candidate details and PDF resume.
  - Returns instant JSON evaluation with semantic match score and missing skill breakdown.

### Job Management & Cutoff
- `POST /api/v1/jobs` — Create new job requisition with attitude round flags.
- `POST /api/v1/jobs/:jobId/apply-cutoff` — Approve AI-predicted $X\%$ or apply manual $Y\%$ cutoff filter.

### Assessment Portal
- `POST /api/v1/assessments/generate/:configId` — Generate customized multi-set dynamic quiz.
- `POST /api/v1/assessments/submit` — Submit answers for instant grading.

### AI Live Interview
- `WS /api/v1/interviews/session/:candidateId` — Bi-directional WebSocket stream for real-time video interview questioning, audio transcription via Whisper, and automated scorecard generation.

### Selection & Purge
- `GET /api/v1/jobs/:jobId/leaderboard` — Access candidate evaluations sorted by overall score.
- `POST /api/v1/jobs/:jobId/select-f2f` — Dispatch invitations to selected finalists.
- `DELETE /api/v1/jobs/:jobId/purge-all` — Irreversibly wipe all telemetry and candidate records.

---

## 📄 License

Distributed under the MIT License. Designed and engineered for enterprise recruitment automation showcase.
```
