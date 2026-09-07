# CareerGraph — Enterprise Backend System

> **A Modular Monolith Backend for Student Career Guidance, Personalized Roadmaps, and Institutional Learning Analytics.**  
> Built strictly to the specifications of `CareerGraph_Backend_FRD.md`.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%20%7C%2020%20LTS-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0%2B-brightgreen.svg)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-7.x-red.svg)](https://redis.io/)
[![Tests](https://img.shields.io/badge/Tests-22%20Suites%20Passing-success.svg)](#testing--quality-assurance)

---

## 1. Executive Summary & Product Loop

CareerGraph bridges the gap between academic education and modern industry career readiness. Designed with a frontend-first mindset and implemented as a robust **Modular Monolith**, the backend orchestrates the complete student growth journey:

```text
                  +--------------------------+
                  |  1. Student Onboarding   |
                  |  Profile, College, CGPA  |
                  +--------------------------+
                               |
                               v
                  +--------------------------+
                  |  2. Career Goal Pathway  |
                  |  Target Career Selection |
                  +--------------------------+
                               |
                               v
                  +--------------------------+
                  |  3. Skills & Assessment  |
                  |  Objective MCQs & Score  |
                  +--------------------------+
                               |
                               v
                  +--------------------------+
                  |  4. Dynamic Roadmap Gen  |
                  |  Ordered by Prereq Graph |
                  +--------------------------+
                               |
                               v
                  +--------------------------+
                  |  5. Learning & Practice  |
                  |  Resources & Mock QA     |
                  +--------------------------+
                               |
                               v
                  +--------------------------+
                  |  6. Recalculate & Repeat |
                  |  Skill State Upgraded    |
                  +--------------------------+
```

---

## 2. Architecture & Design Principles

### Modular Monolith
The application is unified within a single deployable unit while strictly segregating domain boundaries under `src/modules/`. Modules communicate through typed service contracts and database models, ensuring maximum maintainability without distributed system overhead:

```text
careergraph-backend/
├── src/
│   ├── common/                  # Shared kernel (middleware, enums, errors, responses)
│   ├── config/                  # Environment variables, database, redis connections
│   ├── models/                  # 39 Mongoose persistent schemas and indexes
│   ├── modules/                 # 19 Functional domain modules
│   │   ├── auth/                # Dual-token auth, session rotation, password reset
│   │   ├── users/               # Base account identity and preferences
│   │   ├── students/            # Academic profiles, CGPA, projects, certifications
│   │   ├── careers/             # Career pathways, salary ranges, industry demand
│   │   ├── skills/              # Global skill ontology, prerequisite graph, skill gaps
│   │   ├── assessments/         # Question banks, attempt sessions, objective scoring
│   │   ├── roadmaps/            # Step generation, status tracking, recalculation
│   │   ├── resources/           # Academic notes, videos, AI/RAG engine stubs
│   │   ├── jobs/                # JD keyword analyzer, semantic match interface
│   │   ├── community/           # Discussion forums, comments, likes, reports
│   │   ├── seniors/             # Verified placement experiences and interview tips
│   │   ├── opportunities/       # Job/internship postings, scam risk telemetry
│   │   ├── interviews/          # Mock technical/behavioral interviews, rubric scores
│   │   ├── notifications/       # User notification center & unread tracking
│   │   ├── settings/            # Notification toggles, theme, account deactivation
│   │   ├── files/               # S3-compatible pre-signed upload URL generator
│   │   ├── admin/               # System oversight, user/report moderation, taxonomy
│   │   ├── faculty/             # Institutional dashboard, verified materials, analytics
│   │   └── audit/               # Immutable security and mutation audit logging
│   ├── routes/                  # Central API router mounting /api/v1
│   └── app.ts                   # Express application setup & middleware stack
├── docs/                        # 10 Exhaustive architecture and operational manuals
├── Dockerfile                   # Multi-stage production container image
├── docker-compose.yml           # Complete local environment (App + Mongo + Redis)
└── package.json                 # Dependency tree & NPM scripts
```

### Core Architecture Highlights
1. **Unified Envelope Response Pattern**:
   - `sendSuccess(res, data, message)` -> `{ success: true, data: ..., message: ... }`
   - `sendCreated(res, data, message)` -> HTTP 201 Created
   - `sendPaginated(res, items, pagination)` -> `{ success: true, data: [...], pagination: { page, limit, total, totalPages } }`
2. **Global Centralized Error Pipeline**:
   - Operational errors inherit from `AppError` with semantic error codes (`ErrorCode`).
   - Mongoose validation, duplicate key errors (`11000`), and JWT errors automatically map to appropriate HTTP codes (400, 401, 403, 404, 409, 422, 429).
3. **Pluggable AI/RAG Interfaces**:
   - All AI/ML functionalities implement clean TypeScript interfaces (`RecommendationEngine`, `KnowledgeRetrievalEngine`, `SemanticMatchingEngine`).
   - Controlled HTTP 501 `AI_NOT_ENABLED` responses are returned until vector databases or LLMs are connected—**never** faking or hallucinating scores.

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | Node.js (v18+ / v20 LTS) | High-throughput asynchronous runtime |
| **Language** | TypeScript 5.x | Strict compile-time safety and self-documenting code |
| **Framework** | Express.js 4.x | Fast, unopinionated web server |
| **Database** | MongoDB 6.0+ / Mongoose 7.x | Schema-validated document store with transactions |
| **In-Memory Cache** | Redis 7.x / ioredis | Fast session validation, rate limiting, and caching |
| **Authentication** | JWT + bcrypt | Dual access (15m) and sliding refresh (7d) tokens |
| **Validation** | class-validator & class-transformer | Strict DTO validation and input sanitization |
| **Security** | Helmet, CORS, Express-Rate-Limit | Header hardening, origin protection, DDoS defense |
| **Object Storage** | S3-Compatible Storage | Pre-signed URL uploads for resumes and assets |
| **Testing** | Jest, Supertest, MongoMemoryReplSet | 22 comprehensive E2E and integration test suites |

---

## 4. Complete Module & Feature Matrix (Phases 1–11)

### Phase 1: Authentication & RBAC (AUTH-01 to AUTH-10)
- **Endpoints**: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`, `POST /auth/logout`, `POST /auth/verify-email`, `POST /auth/resend-verification`, `POST /auth/forgot-password`, `POST /auth/reset-password`.
- **Security**:
  - Refresh tokens stored as SHA-256 hashes in MongoDB.
  - **Theft Detection & Rotation**: Reusing an old refresh token revokes all active sessions for the compromised user account.
  - Multi-role RBAC: Users can hold multiple roles simultaneously (`STUDENT`, `SENIOR`, `MENTOR`, `FACULTY`, `MODERATOR`, `ADMIN`).

### Phase 2: Student Profile & Portfolio (PROFILE-01 to PROFILE-08)
- **Endpoints**: `GET /students/me/profile`, `GET & PATCH /students/me/academic`, `PATCH /students/me/career-goals`, `POST & DELETE /students/me/projects`, `GET /students/me/dashboard`.
- **Capabilities**: CGPA, year, semester, college, academic interests, portfolio projects with tech stack arrays, and certifications.

### Phase 3: Careers, Skills & Ontologies (CAREER-01..07, SKILL-01..08)
- **Endpoints**: `GET /careers`, `GET /careers/:id`, `GET /careers/:id/skills`, `GET /careers/:id/skill-graph`, `POST /students/me/career-goal`, `GET /skills`, `GET /skills/:id`, `GET /skills/graph`, `PUT /students/me/skills/:id`, `GET /students/me/skill-gaps`.
- **Graph Taxonomy**: Directed prerequisite relationships (`fromSkillId` -> `toSkillId`), target career proficiency benchmarks, and deterministic skill gap calculations.

### Phase 4: Assessments & Objective Scoring (ASSESS-01 to ASSESS-08)
- **Endpoints**: `GET /assessments`, `GET /assessments/:id`, `GET /assessments/:id/questions` (sanitized, hides correct answers), `POST /assessments/:id/start`, `POST /assessment-attempts/:id/answer`, `POST /assessment-attempts/:id/submit`, `GET /assessment-attempts/:id/result`.
- **Scoring Engine**: Evaluates answers objectively against question answer keys, generates topic-by-topic breakdowns, identifies weak areas, and updates the student's skill proficiency state.

### Phase 5: Dynamic Roadmaps (ROADMAP-01 to ROADMAP-05)
- **Endpoints**: `GET /students/me/roadmap`, `POST /students/me/roadmap/generate`, `POST /students/me/roadmap/recalculate`, `PATCH /roadmap-steps/:id/status`.
- **Features**: Generates ordered milestones based on prerequisite graphs. Recalculation intelligently marks steps complete as skills improve.

### Phase 6: Learning Resources & AI/RAG Interfaces (RESOURCE-01 to RESOURCE-08)
- **Endpoints**: `GET /resources`, `POST /resources`, `GET /resources/:id`, `PATCH & DELETE /resources/:id`, `POST /resources/:id/access`, `POST /resources/:id/complete`, `POST /resources/knowledge/search`, `POST /resources/knowledge/ask`.
- **Support**: 10 resource formats (`PDF`, `VIDEO`, `ARTICLE`, `COURSE`, `PRACTICE`, `PROJECT`, `NOTE`, `SYLLABUS`, `LAB_MANUAL`, `QUESTION_PAPER`). Pluggable AI engine interfaces returning controlled 501 `AI_NOT_ENABLED`.

### Phase 7: Job Analyzer & Community (JOB-01..06, COMMUNITY-01..10)
- **Endpoints**: `POST /job-analyses`, `GET /job-analyses/:id`, `POST /job-analyses/:id/analyze`, `POST /job-analyses/:id/add-to-roadmap`, `POST /job-analyses/semantic/match`, `/community/posts(/:id)`, `/comments`, `/like`, `/report`, `/similar`.
- **Analyzer Engine**: Deterministic regex word-boundary keyword extraction against the skills ontology; directly appends missing JD skills to the active roadmap. Community feeds with threading, likes, and abuse reporting.

### Phase 8: Senior Experiences & Opportunity Telemetry (SENIOR-01..05, OPP-01..08)
- **Endpoints**: `GET & POST /senior-experiences`, `PATCH /senior-experiences/:id/verify`, `GET & POST /opportunities`, `PATCH /opportunities/:id/verify`, `POST /opportunities/:id/risk-signals`, `POST /opportunities/:id/save`.
- **Verification & Safety**: Institutional badges for verified alumni experiences and employer postings. Evidence-based risk telemetry (`UNREALISTIC_SALARY`, `UPFRONT_PAYMENT_REQUEST`, etc.) calculating opportunity risk levels.

### Phase 9: Mock Interviews, Notifications, Settings, Files (INTERVIEW-01..07, NOTIFY-01..04, SETTINGS-01..04, FILE-01..03)
- **Endpoints**: `/interviews(/:id/questions/answers/complete/result)`, `/notifications(/unread-count/:id/read/read-all)`, `/settings(/change-password/account)`, `/files/upload-url`, `/files/confirm`.
- **Features**: Rubric-based mock interview scoring, user notification dispatching, theme & privacy preferences, session revocation upon password rotation, S3 pre-signed upload URLs.

### Phase 10: Admin, Faculty, Audit Logging & Seeder (ADMIN-01..10, FACULTY-01..04, AUDIT-01..02)
- **Admin**: System dashboard, user management, report resolution queue, career/skill taxonomy editing, and audit trail inspection.
- **Faculty**: Departmental metrics, curriculum assessment authoring, auto-verified academic resource uploads, student cohort analytics.
- **Audit Logging**: Immutable action trail capturing actor, role, action, target resource, IP, user-agent, and before/after payloads.

### Phase 11: Security Hardening & Documentation
- IDOR protections across all user-scoped queries.
- Role hierarchy enforcement (`STUDENT` < `SENIOR`/`MENTOR` < `FACULTY` < `MODERATOR` < `ADMIN`).
- NoSQL operator injection resistance.
- Comprehensive architectural and operational documentation suite.

---

## 5. Pre-Configured Demo Accounts

Run `npm run seed` to provision all roles with realistic demo data:

| Role | Name | Email | Password | Key Privileges |
|---|---|---|---|---|
| **Student** | Alex Rivera | `student@careergraph.dev` | `Student@123` | Roadmaps, assessments, skills, mock interviews, job analyzer |
| **Senior** | Sarah Chen | `senior@careergraph.dev` | `Senior@123` | Share interview experiences, tips, community mentoring |
| **Mentor** | Kavita Rao | `mentor@careergraph.dev` | `Mentor@123` | Guidance, industry advice, senior workflows |
| **Faculty** | Dr. Robert Vance | `faculty@careergraph.dev` | `Faculty@123` | Department dashboard, create assessments, upload verified notes, cohort analytics |
| **Moderator** | Elena Rostova | `moderator@careergraph.dev` | `Moderator@123` | Moderate community posts, resolve reports, manage flagged content |
| **Admin** | Marcus Sterling | `admin@careergraph.dev` | `Admin@123` | Full system control, user accounts, career/skill taxonomies, audit logs |

---

## 6. Quick Start & Local Setup

### Prerequisites
- **Node.js**: v18.x or v20.x LTS
- **MongoDB**: v6.0+ (Replica Set mode required for multi-collection transactions)
- **Redis**: v7.0+
- **Docker & Docker Compose** (Optional, recommended for instant setup)

### Option A: Local Development Setup

1. **Clone and Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment Variables**:
   Copy the example environment configuration:
   ```bash
   cp .env.example .env
   ```
   *(Ensure `MONGODB_URI` points to a replica set, e.g., `mongodb://localhost:27017/careergraph?replicaSet=rs0`)*

3. **Verify Type-Safety & Build**:
   ```bash
   npx tsc --noEmit
   ```

4. **Seed the Database**:
   ```bash
   npm run seed
   ```
   *Seeds all 6 demo accounts, 36+ skills, 7 career pathways, and sample content.*

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   *The server starts on `http://localhost:5000/api/v1`.*

---

### Option B: Docker Compose Setup

Run the entire backend stack (Node.js API + MongoDB Replica Set + Redis) with a single command:
```bash
docker-compose up -d --build
```
- API Base: `http://localhost:5000/api/v1`
- Health Check: `http://localhost:5000/health`

---

## 7. Testing & Quality Assurance

The backend contains **22 complete test suites** covering unit, integration, and E2E scenarios across all 11 phases.

```bash
# Run all test suites
npx jest --runInBand --forceExit

# Run security hardening tests
npx jest src/modules/admin/tests/security-hardening.integration.test.ts --runInBand --forceExit

# Run tests for a specific module (e.g. assessments)
npx jest src/modules/assessments/tests/assessments.e2e.test.ts --runInBand --forceExit
```

### Verified Test Suites:
- `auth.e2e.test.ts` & `auth.service.test.ts` (Authentication, JWT rotation, session revocation)
- `students.test.ts` (Profiles, academics, CGPA, projects)
- `careers.e2e.test.ts` & `skills.e2e.test.ts` (Career graph, skill gaps, proficiency history)
- `assessments.e2e.test.ts` (Assessment sessions, objective scoring, skill state updates)
- `roadmaps.e2e.test.ts` (Roadmap generation, step progress, recalculation)
- `resources.e2e.test.ts` (Resource formats, access tracking, controlled AI stubs)
- `jobs.e2e.test.ts` (JD keyword extraction, roadmap sync)
- `community.e2e.test.ts` (Post creation, threading, likes, reporting)
- `seniors.e2e.test.ts` & `opportunities.e2e.test.ts` (Placement reviews, scam risk signals)
- `interviews.e2e.test.ts` (Mock interview evaluation rubrics)
- `notifications.e2e.test.ts` (Unread counts, read transitions)
- `settings.e2e.test.ts` (Preference toggles, password rotation, soft deactivation)
- `files.e2e.test.ts` (Pre-signed S3 upload lifecycle)
- `admin.e2e.test.ts`, `faculty.e2e.test.ts`, `audit.e2e.test.ts` (Dashboards, moderation, audit trail)
- `security-hardening.integration.test.ts` (IDOR, role hierarchy, NoSQL injection resistance)

---

## 8. Complete Documentation Library

Detailed documentation is available in the [`docs/`](./docs/) directory:

| Document | Description |
|---|---|
| **[01. Architecture Map](./docs/01_ARCHITECTURE_MAP.md)** | Modular Monolith layout, request lifecycle, data flow, and error handling. |
| **[02. API Route Catalog](./docs/02_API_ROUTE_CATALOG.md)** | Exhaustive reference of all endpoints, HTTP methods, DTOs, and status codes. |
| **[03. Database Schema Reference](./docs/03_DATABASE_SCHEMA_REFERENCE.md)** | Comprehensive schema guide for all 39 MongoDB collections, hooks, and indexes. |
| **[04. State-Transition Maps](./docs/04_STATE_TRANSITION_MAPS.md)** | Lifecycles for assessments, roadmaps, institutional verification, and reports. |
| **[05. Security Implementation Report](./docs/05_SECURITY_IMPLEMENTATION_REPORT.md)** | Token rotation, IDOR protections, RBAC hierarchy, input sanitization, rate limits. |
| **[06. AI/RAG Integration Blueprint](./docs/06_AI_RAG_INTEGRATION_BLUEPRINT.md)** | Clean interface abstractions, controlled 501 stubs, and vector integration roadmap. |
| **[07. Verification & Moderation Pipeline](./docs/07_VERIFICATION_MODERATION_PIPELINE.md)** | Faculty vetting workflows, senior badges, and community abuse resolution. |
| **[08. Demo Accounts & Verification Guide](./docs/08_DEMO_ACCOUNTS_VERIFICATION_GUIDE.md)** | Pre-seeded credentials and step-by-step verification flows for every role. |
| **[09. Deployment & Operations Manual](./docs/09_DEPLOYMENT_OPERATIONS_MANUAL.md)** | Production environment setup, Docker Compose, health checks, and monitoring. |
| **[10. Implementation Completeness Matrix](./docs/10_IMPLEMENTATION_COMPLETENESS_MATRIX.md)** | Traceability matrix proving 100% completion across all requirements. |

---

## 9. License

Proprietary — Developed for CareerGraph Student Career Guidance Platform.
