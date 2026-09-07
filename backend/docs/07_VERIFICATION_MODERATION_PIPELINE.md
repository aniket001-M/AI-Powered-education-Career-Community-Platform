# CareerGraph — Verification & Moderation Pipeline

## 1. Overview
Trust and content integrity are core pillars of CareerGraph. The system features a two-tiered verification and moderation architecture:
1. **Institutional Verification Pipeline**: For official curriculum resources, senior alumni placement experiences, and internship/job opportunities.
2. **Community Moderation Pipeline**: For user discussions, comments, and scam telemetry reporting.

---

## 2. Institutional Verification Pipeline

### A. Academic Resources
- **Submission**: Any user can submit notes, practice problems, or project ideas.
- **Verification Rule**:
  - Uploaded by `FACULTY` or `ADMIN` -> Automatically assigned `verificationStatus: 'VERIFIED'`.
  - Uploaded by `STUDENT` or `SENIOR` -> Assigned `verificationStatus: 'PENDING'`.
- **Review**: Faculty and Admins view pending materials in `/resources?status=PENDING` and approve or reject them.

### B. Senior & Alumni Placement Experiences
- **Submission**: Users with `SENIOR` or `MENTOR` role submit real interview round details, preparation strategies, and compensation packages (`POST /api/v1/senior-experiences`).
- **Review**: Institutional Faculty or Admin reviews the claim against college records and triggers:
  `PATCH /api/v1/senior-experiences/:experienceId/verify`
- **Result**: `isVerified: true`, `verifiedBy: facultyId`, `verifiedAt: timestamp`. Displays a verified badge on student feeds.

### C. Opportunities & Jobs
- **Submission**: Opportunities posted by recruiters or campus placement cells.
- **Verification**: Verified via `PATCH /api/v1/opportunities/:id/verify` once legitimate offer letters or official domain emails are confirmed.
- **Scam Protection**:
  - Users can submit evidence-based telemetry (`POST /api/v1/opportunities/:id/risk-signals`) reporting suspicious items: `UNREALISTIC_SALARY`, `UPFRONT_PAYMENT_REQUEST`, `SUSPICIOUS_EMAIL`, `VAGUE_JOB_DESCRIPTION`.
  - The system aggregates risk signals into `riskScore` and assigns risk level (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`) without automatically false-flagging employers.

---

## 3. Community Content Moderation

### Flagging & Queue
1. Any authenticated user can report a post via `POST /api/v1/community/posts/:postId/report`.
2. Duplicate reports by the same user on the same post are rejected with HTTP 409 (`Conflict`).
3. Report increments `reportsCount` on the post and places a `CommunityReport` in the moderation queue.

### Resolution by Moderators / Admins
- Queue accessible via `GET /api/v1/admin/reports?status=PENDING`.
- Action resolution via `PATCH /api/v1/admin/reports/:reportId`:
  - `DISMISSED`: Dismisses report as false alarm.
  - `ACTION_TAKEN`: Triggers selected moderation action (e.g. `DELETE_POST` which performs an atomic soft-delete of `CommunityPost`, setting `isDeleted: true` and `deletedAt: new Date()`).
- All actions are immutably logged to `AuditLog`.
