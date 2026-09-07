# CareerGraph — Demo Accounts & Verification Guide

## 1. Pre-configured Demo Accounts
The database seeder (`npm run seed`) provisions the following accounts:

| Role | Name | Email | Password | Primary Capabilities |
|---|---|---|---|---|
| **STUDENT** | Alex Rivera | `student@careergraph.dev` | `Student@123` | Roadmaps, assessments, mock interviews, career goals, job analyzer, community |
| **SENIOR** | Sarah Chen | `senior@careergraph.dev` | `Senior@123` | Senior placement experiences, mentoring, community discussions |
| **MENTOR** | Kavita Rao | `mentor@careergraph.dev` | `Mentor@123` | Career guidance, industry advice, senior experiences |
| **FACULTY** | Dr. Robert Vance | `faculty@careergraph.dev` | `Faculty@123` | Departmental dashboard, create assessments, upload verified academic resources, cohort analytics |
| **MODERATOR** | Elena Rostova | `moderator@careergraph.dev` | `Moderator@123` | Review flagged community posts, resolve reports, content moderation |
| **ADMIN** | Marcus Sterling | `admin@careergraph.dev` | `Admin@123` | Complete system oversight, user management, career & skill taxonomy curation, audit logs |

---

## 2. End-to-End Verification Walkthrough

### Step 1: Student Authentication & Career Selection
1. Login as Alex Rivera (`student@careergraph.dev`).
2. Fetch careers list: `GET /api/v1/careers`.
3. Select "Software Engineer" as goal: `POST /api/v1/students/me/career-goal` with `{ careerId: "<software_engineer_id>" }`.
4. Inspect current skill gaps: `GET /api/v1/students/me/skill-gaps`.

### Step 2: Assessment & Skill State Update
1. Retrieve technical assessment: `GET /api/v1/assessments?careerId=<id>`.
2. Start attempt: `POST /api/v1/assessments/:id/start`.
3. Submit answers: `POST /api/v1/assessment-attempts/:attemptId/answer`.
4. Finalize attempt: `POST /api/v1/assessment-attempts/:attemptId/submit`.
5. Verify updated skill proficiency in `GET /api/v1/students/me/skills`.

### Step 3: Personalized Roadmap Generation
1. Generate roadmap: `POST /api/v1/students/me/roadmap/generate`.
2. Inspect steps ordered by prerequisites: `GET /api/v1/students/me/roadmap`.
3. Complete step: `PATCH /api/v1/roadmap-steps/:stepId/status` with `{ status: "COMPLETED" }`.

### Step 4: Faculty Operations
1. Login as Dr. Robert Vance (`faculty@careergraph.dev`).
2. Check faculty dashboard: `GET /api/v1/faculty/dashboard`.
3. Upload academic lecture notes: `POST /api/v1/faculty/resources` (verified automatically).
4. Review student cohort analytics: `GET /api/v1/faculty/analytics`.

### Step 5: Community & Moderation
1. As Alex Rivera, create discussion: `POST /api/v1/community/posts`.
2. As Sarah Chen, report post: `POST /api/v1/community/posts/:id/report` with `{ reason: "SPAM" }`.
3. Login as Elena Rostova (`moderator@careergraph.dev`).
4. View queue: `GET /api/v1/admin/reports?status=PENDING`.
5. Resolve: `PATCH /api/v1/admin/reports/:id` with `{ status: "ACTION_TAKEN", actionTaken: "DELETE_POST" }`.

### Step 6: System Administration & Audit Logs
1. Login as Marcus Sterling (`admin@careergraph.dev`).
2. View administrative metrics: `GET /api/v1/admin/dashboard`.
3. Verify all preceding actions left immutable audit entries: `GET /api/v1/admin/audit-logs`.
