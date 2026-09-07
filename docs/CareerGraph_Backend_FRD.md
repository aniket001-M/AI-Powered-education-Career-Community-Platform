# CareerGraph --- Backend Functional Requirements Document (FRD)

## Backend-only specification for the frontend-first CareerGraph project

**Project:** CareerGraph\
**Architecture:** Modular Monolith\
**Backend:** Node.js + Express.js + TypeScript\
**Database:** MongoDB\
**Cache / short-lived state:** Redis\
**File storage:** S3-compatible object storage\
**API style:** REST\
**API prefix:** `/api/v1`\
**Authentication:** JWT access + refresh tokens\
**AI/RAG/ML:** Deferred to a later phase

---

# 1. Purpose

This document defines the complete backend required to support the
CareerGraph frontend.

The backend must match the existing frontend FRD and provide APIs for:

- authentication
- onboarding
- student profile
- careers
- skills
- assessments
- student skill state
- skill-gap analysis
- roadmaps
- learning resources
- job descriptions
- opportunities
- community
- senior/alumni experiences
- interviews
- notifications
- user settings
- admin
- faculty
- senior workflows
- audit logs
- file uploads
- verification/moderation

The backend must be implemented as a **modular monolith**, not as
microservices.

AI, RAG, knowledge tracing, semantic matching, recommendation models,
community NLP, risk classification and AI interview
generation/evaluation will be integrated later. The backend must
nevertheless be designed so those capabilities can be plugged in without
restructuring the application.

---

# 2. Core Product Flow

The backend must support this complete product loop:

```text
Student
   ↓
Profile
   ↓
Career Goal
   ↓
Assessment
   ↓
Skill State
   ↓
Skill Gap
   ↓
Roadmap
   ↓
Learning Resources
   ↓
Practice
   ↓
Assessment
   ↓
Updated Skill State
   ↓
Updated Roadmap
```

Additional flows:

```text
Job Description
   ↓
Stored Job Analysis
   ↓
Future AI/ML Matching
```

```text
College Document
   ↓
Stored Resource
   ↓
Future RAG Processing
```

```text
Interview Session
   ↓
Questions / Answers
   ↓
Future AI Evaluation
```

```text
Opportunity
   ↓
Verification / Risk Signals
   ↓
Student Discovery
```

---

# 3. Architectural Principle

Use a **modular monolith**.

Do NOT create separate deployable services for:

- authentication
- users
- careers
- assessments
- community
- opportunities
- AI

Instead:

```text
                    CareerGraph Backend
                           |
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
   Auth Module        Student Module     Career Module
        ↓                  ↓                  ↓
 Assessment Module    Skill Module      Roadmap Module
        ↓                  ↓                  ↓
 Resource Module     Community Module   Opportunity Module
        ↓                  ↓                  ↓
 Senior Module       Interview Module   Admin Module
        ↓                  ↓                  ↓
 Notification       File Module         Audit Module
```

All modules live inside one Express.js application and one deployment unit.

Use clear module boundaries so individual modules can later be extracted
if required.

---

# 4. Recommended Technology Stack

## Application

- Node.js
- Express.js
- TypeScript
- REST APIs

## Database

- MongoDB
- Mongoose ODM

Mongoose is recommended for:

- schema management
- migrations
- type-safe database access
- transactions

TypeORM may be substituted if the team has already standardized on it.

## Authentication

- JWT
- bcrypt/Argon2 password hashing
- refresh-token rotation
- email verification

## Validation

- class-validator
- class-transformer

## Security

- Helmet
- CORS configuration
- rate limiting
- DTO validation
- secure password handling
- authorization guards
- audit logging

## Cache

- Redis

Initially use Redis for:

- refresh token/session metadata
- rate limiting
- short-lived cache
- OTP/email verification state if implemented

## Files

S3-compatible object storage.

Store only metadata in MongoDB.

## API documentation

- Swagger / OpenAPI

## Logging

Structured application logs.

---

# 65. Express + MongoDB Architecture

The backend must be implemented as a single Node.js/Express application with modular boundaries.

Recommended request flow:

```text
HTTP Request
    ↓
Express Router
    ↓
Middleware
    ↓
Controller
    ↓
Service
    ↓
Repository / Mongoose Model
    ↓
MongoDB
```

Recommended project structure:

```text
src/
├── app.ts
├── server.ts
├── config/
│   ├── env.ts
│   ├── database.ts
│   └── redis.ts
├── common/
│   ├── errors/
│   ├── middleware/
│   ├── auth/
│   ├── validation/
│   ├── pagination/
│   ├── responses/
│   └── utils/
├── modules/
│   ├── auth/
│   │   ├── auth.routes.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.validation.ts
│   │   └── auth.types.ts
│   ├── users/
│   ├── students/
│   ├── careers/
│   ├── skills/
│   ├── assessments/
│   ├── roadmaps/
│   ├── resources/
│   ├── jobs/
│   ├── community/
│   ├── seniors/
│   ├── opportunities/
│   ├── interviews/
│   ├── notifications/
│   ├── settings/
│   ├── admin/
│   ├── faculty/
│   ├── files/
│   └── audit/
├── models/
├── routes/
└── tests/
```

Prefer feature-local models, controllers, services and validators as the project grows. Keep shared infrastructure in `common/`.

Use Mongoose models with explicit indexes. Use MongoDB ObjectId references for relationships and `populate()` only where it improves the API response; avoid excessive population and N+1 queries.

Use MongoDB transactions for operations that modify multiple collections and require atomicity, such as assessment submission followed by result and skill-state updates. This requires a MongoDB deployment that supports transactions.

Use `.lean()` for read-heavy queries where Mongoose document methods are not required.

Do not expose MongoDB `_id` directly if the frontend contract uses `id`; map identifiers consistently in response DTOs/serializers.

# 65. API Conventions

Base URL:

```text
/api/v1
```

Example:

```text
GET /api/v1/careers
```

Use JSON for normal requests/responses.

Use `multipart/form-data` for file uploads.

---

# 65. Standard Response Format

Successful response:

```json
{
  "success": true,
  "data": {},
  "message": "Success"
}
```

Paginated response:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Career not found"
  }
}
```

Never expose:

- password hashes
- refresh tokens
- internal database errors
- stack traces in production

---

# 65. API Endpoint Count

The initial backend specification contains approximately **100 REST
endpoints**.

Recommended endpoint distribution:

Module Endpoints

---

Authentication 10
User/Profile 8
Careers 7
Skills 8
Assessments 10
Roadmaps 7
Resources 8
Job Analyzer 5
Community 10
Senior/Alumni 6
Opportunities 8
Interviews 7
Notifications 4
Settings 4
Admin 10
Faculty 4
Files 3
Audit 2
**Total** **121**

Some endpoints are shared by frontend flows and role-specific
interfaces. This is intentionally more complete than the MVP so the
backend does not need to be redesigned when additional frontend screens
are connected.

---

# 65. Module Structure

Recommended Express.js structure:

```text
src/
├── app.ts
├── server.ts
├── config/
├── common/
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
│   ├── pipes/
│   ├── dto/
│   ├── enums/
│   └── utils/
│
├── config/
│
├── auth/
├── users/
├── students/
├── careers/
├── skills/
├── assessments/
├── roadmaps/
├── resources/
├── jobs/
├── community/
├── seniors/
├── opportunities/
├── interviews/
├── notifications/
├── settings/
├── admin/
├── faculty/
├── files/
└── audit/
```

Each module should contain:

```text
module/
├── module.ts
├── controller.ts
├── service.ts
├── repository/
├── dto/
├── entities/
├── policies/
└── tests/
```

---

# 65. Roles

The backend must support:

```text
STUDENT
SENIOR
MENTOR
FACULTY
MODERATOR
ADMIN
```

A user can have one primary role initially.

Design the authorization layer so multi-role users can be supported
later.

---

# 65. Authentication Module

## AUTH-01 Register

```http
POST /api/v1/auth/register
```

Request:

```json
{
  "name": "Rahul",
  "email": "rahul@example.com",
  "password": "password",
  "role": "STUDENT"
}
```

Rules:

- validate email
- enforce password policy
- hash password
- create user
- create role
- create student profile if role is STUDENT
- return access/refresh tokens or require verification according to
  chosen product policy

---

## AUTH-02 Login

```http
POST /api/v1/auth/login
```

---

## AUTH-03 Refresh Token

```http
POST /api/v1/auth/refresh
```

Implement refresh-token rotation.

---

## AUTH-04 Logout

```http
POST /api/v1/auth/logout
```

Invalidate current refresh session.

---

## AUTH-05 Logout All Sessions

```http
POST /api/v1/auth/logout-all
```

---

## AUTH-06 Email Verification

```http
POST /api/v1/auth/verify-email
```

---

## AUTH-07 Resend Verification

```http
POST /api/v1/auth/resend-verification
```

---

## AUTH-08 Forgot Password

```http
POST /api/v1/auth/forgot-password
```

---

## AUTH-09 Reset Password

```http
POST /api/v1/auth/reset-password
```

---

## AUTH-10 Current User

```http
GET /api/v1/auth/me
```

Return:

- id
- name
- email
- role
- avatar
- verification state

---

# 65. User and Student Profile Module

## USER-01 Get Profile

```http
GET /api/v1/users/me
```

## USER-02 Update Profile

```http
PATCH /api/v1/users/me
```

Fields:

- name
- avatar
- bio
- phone if required
- department
- year
- semester

## USER-03 Get Academic Profile

```http
GET /api/v1/students/me/academic
```

## USER-04 Update Academic Profile

```http
PATCH /api/v1/students/me/academic
```

Fields:

- college
- department
- year
- semester
- CGPA/percentage
- academic interests

## USER-05 Get Full Student Profile

```http
GET /api/v1/students/me/profile
```

Return aggregated:

- personal data
- academic data
- skills
- career goals
- projects
- certifications
- assessment summary
- interview summary

## USER-06 Update Career Goals

```http
PATCH /api/v1/students/me/career-goals
```

## USER-07 Add Project

```http
POST /api/v1/students/me/projects
```

## USER-08 Delete Project

```http
DELETE /api/v1/students/me/projects/:projectId
```

---

# 65. Careers Module

Career data is managed by administrators but consumed heavily by
students.

## CAREER-01 List Careers

```http
GET /api/v1/careers
```

Filters:

- category
- search
- active

## CAREER-02 Get Career

```http
GET /api/v1/careers/:careerId
```

## CAREER-03 Get Career Skills

```http
GET /api/v1/careers/:careerId/skills
```

## CAREER-04 Get Career Skill Graph

```http
GET /api/v1/careers/:careerId/skill-graph
```

## CAREER-05 Select Student Career

```http
POST /api/v1/students/me/career-goals
```

## CAREER-06 Remove Student Career Goal

```http
DELETE /api/v1/students/me/career-goals/:careerGoalId
```

## CAREER-07 Get Student Career Goals

```http
GET /api/v1/students/me/career-goals
```

---

# 65. Skills Module

The system needs a structured skill taxonomy.

Example:

```text
Programming
 └── Java
     └── OOP

Backend
 ├── REST
 └── Spring Boot

DevOps
 ├── Docker
 └── Cloud
```

## SKILL-01 List Skills

```http
GET /api/v1/skills
```

Filters:

- category
- parent
- search

## SKILL-02 Get Skill

```http
GET /api/v1/skills/:skillId
```

## SKILL-03 Get Skill Children

```http
GET /api/v1/skills/:skillId/children
```

## SKILL-04 Get Skill Graph

```http
GET /api/v1/skills/graph
```

## SKILL-05 Get Student Skills

```http
GET /api/v1/students/me/skills
```

## SKILL-06 Update Student Skill

```http
PATCH /api/v1/students/me/skills/:skillId
```

Allow controlled manual updates.

## SKILL-07 Get Skill History

```http
GET /api/v1/students/me/skills/:skillId/history
```

## SKILL-08 Get Skill Gaps

```http
GET /api/v1/students/me/skill-gaps
```

This endpoint returns the current backend-computed gap using available
structured data.

AI/ML ranking can be added later.

---

# 65. Assessments Module

Assessment structure:

```text
Assessment
 └── Questions
      ├── Topic
      ├── Skill
      └── Difficulty
```

Student attempt:

```text
Assessment
 ↓
Attempt
 ↓
Answers
 ↓
Result
 ↓
Skill Update
```

## ASSESS-01 List Assessments

```http
GET /api/v1/assessments
```

## ASSESS-02 Get Assessment

```http
GET /api/v1/assessments/:assessmentId
```

## ASSESS-03 Get Questions

```http
GET /api/v1/assessments/:assessmentId/questions
```

Do not expose correct answers to students.

## ASSESS-04 Start Attempt

```http
POST /api/v1/assessments/:assessmentId/attempts
```

## ASSESS-05 Get Attempt

```http
GET /api/v1/assessment-attempts/:attemptId
```

## ASSESS-06 Save Answer

```http
POST /api/v1/assessment-attempts/:attemptId/answers
```

## ASSESS-07 Submit Attempt

```http
POST /api/v1/assessment-attempts/:attemptId/submit
```

Server calculates objective score.

## ASSESS-08 Get Result

```http
GET /api/v1/assessment-attempts/:attemptId/result
```

## ASSESS-09 Student Assessment History

```http
GET /api/v1/students/me/assessments
```

## ASSESS-10 Student Weak Areas

```http
GET /api/v1/students/me/assessment-weak-areas
```

---

# 65. Assessment Rules

The server must:

- verify assessment exists
- verify student is allowed to attempt
- prevent unauthorized answer access
- prevent modifying submitted attempts
- record timestamps
- record attempts
- calculate scores server-side
- record topic performance
- record skill performance
- update structured skill state after submission

Do not trust scores submitted by the frontend.

---

# 65. Roadmap Module

The roadmap represents ordered learning steps.

Example:

```text
Programming
 ↓
DSA
 ↓
Spring Boot
 ↓
REST
 ↓
Docker
 ↓
Cloud
```

## ROADMAP-01 Get Current Roadmap

```http
GET /api/v1/students/me/roadmap
```

## ROADMAP-02 Generate/Rebuild Roadmap

```http
POST /api/v1/students/me/roadmap/generate
```

For the first backend phase this can use deterministic/rule-based logic.

Later, AI/ML ranking can replace the implementation.

## ROADMAP-03 Get Roadmap Step

```http
GET /api/v1/roadmap-steps/:stepId
```

## ROADMAP-04 Update Step Status

```http
PATCH /api/v1/roadmap-steps/:stepId
```

Statuses:

```text
LOCKED
AVAILABLE
IN_PROGRESS
COMPLETED
SKIPPED
```

## ROADMAP-05 Complete Learning Activity

```http
POST /api/v1/roadmap-steps/:stepId/complete
```

## ROADMAP-06 Roadmap History

```http
GET /api/v1/students/me/roadmap/history
```

## ROADMAP-07 Recalculate Roadmap

```http
POST /api/v1/students/me/roadmap/recalculate
```

---

# 65. Learning Resources Module

Resources can come from:

- college faculty
- verified users
- administrators
- approved external sources

Resource types:

```text
PDF
VIDEO
ARTICLE
COURSE
PRACTICE
PROJECT
NOTE
SYLLABUS
LAB_MANUAL
QUESTION_PAPER
```

## RESOURCE-01 List Resources

```http
GET /api/v1/resources
```

Filters:

- skill
- subject
- type
- difficulty
- college
- search

## RESOURCE-02 Get Resource

```http
GET /api/v1/resources/:resourceId
```

## RESOURCE-03 Create Resource

```http
POST /api/v1/resources
```

Authorized:

- FACULTY
- ADMIN
- approved SENIOR/MODERATOR where applicable

## RESOURCE-04 Update Resource

```http
PATCH /api/v1/resources/:resourceId
```

## RESOURCE-05 Delete Resource

```http
DELETE /api/v1/resources/:resourceId
```

## RESOURCE-06 Track Resource Access

```http
POST /api/v1/resources/:resourceId/access
```

## RESOURCE-07 Mark Resource Complete

```http
POST /api/v1/resources/:resourceId/complete
```

## RESOURCE-08 Get Student Resource History

```http
GET /api/v1/students/me/resources/history
```

---

# 65. College/RAG Preparation Module

AI/RAG will be implemented later.

The backend must already store documents and metadata.

Resource metadata must include:

```text
title
description
document type
subject
skill
college
department
uploadedBy
verificationStatus
storageKey
createdAt
updatedAt
```

Do NOT implement embeddings or LLM calls yet.

Create an abstraction:

```text
KnowledgeService
```

with future methods:

```text
ingestDocument()
searchKnowledge()
generateGroundedAnswer()
```

For now, these methods may be unimplemented or return a controlled
`AI_NOT_ENABLED` response.

---

# 65. Job Description Analyzer Module

The frontend requires:

```text
Paste JD
Upload JD
Analyze
Show match
Show matched skills
Show missing skills
Show explanation
Add to roadmap
```

AI semantic matching is deferred.

## JOB-01 Create Job Analysis

```http
POST /api/v1/job-analyses
```

Request:

```json
{
  "title": "Backend Software Engineer",
  "description": "Java, Spring Boot, SQL..."
}
```

Store the job description.

## JOB-02 Get Job Analysis

```http
GET /api/v1/job-analyses/:analysisId
```

## JOB-03 List Student Job Analyses

```http
GET /api/v1/students/me/job-analyses
```

## JOB-04 Analyze Job

```http
POST /api/v1/job-analyses/:analysisId/analyze
```

Phase 1 implementation:

- extract simple structured skill matches where possible
- return analysis status

Do not pretend that semantic AI is implemented.

## JOB-05 Add Job Skills to Roadmap

```http
POST /api/v1/job-analyses/:analysisId/add-to-roadmap
```

---

# 65. Community Module

Community supports:

- posts
- comments
- categories
- tags
- likes
- reports
- moderation

## COMMUNITY-01 List Posts

```http
GET /api/v1/community/posts
```

Filters:

- category
- post type
- search
- author
- sort
- page
- limit

## COMMUNITY-02 Get Post

```http
GET /api/v1/community/posts/:postId
```

## COMMUNITY-03 Create Post

```http
POST /api/v1/community/posts
```

## COMMUNITY-04 Update Post

```http
PATCH /api/v1/community/posts/:postId
```

Only author/moderator/admin.

## COMMUNITY-05 Delete Post

```http
DELETE /api/v1/community/posts/:postId
```

## COMMUNITY-06 Add Comment

```http
POST /api/v1/community/posts/:postId/comments
```

## COMMUNITY-07 List Comments

```http
GET /api/v1/community/posts/:postId/comments
```

## COMMUNITY-08 Like/Unlike Post

```http
POST /api/v1/community/posts/:postId/like
```

Calling again can toggle or use explicit unlike endpoint if preferred.

## COMMUNITY-09 Report Post

```http
POST /api/v1/community/posts/:postId/report
```

## COMMUNITY-10 Similar Discussions

```http
GET /api/v1/community/posts/:postId/similar
```

Phase 1 can use keyword/tag matching.

Embeddings will be added later.

---

# 65. Senior/Alumni Module

Senior/alumni knowledge is a key college-specific feature.

## SENIOR-01 List Experiences

```http
GET /api/v1/senior-experiences
```

Filters:

- company
- role
- batch
- department

## SENIOR-02 Get Experience

```http
GET /api/v1/senior-experiences/:experienceId
```

## SENIOR-03 Create Experience

```http
POST /api/v1/senior-experiences
```

## SENIOR-04 Update Experience

```http
PATCH /api/v1/senior-experiences/:experienceId
```

## SENIOR-05 Delete Experience

```http
DELETE /api/v1/senior-experiences/:experienceId
```

## SENIOR-06 Verify Experience

```http
PATCH /api/v1/senior-experiences/:experienceId/verify
```

Only authorized moderator/faculty/admin.

Verification states:

```text
PENDING
VERIFIED
REJECTED
```

---

# 65. Opportunities Module

Opportunity types:

```text
INTERNSHIP
JOB
SCHOLARSHIP
HACKATHON
COMPETITION
CAMPUS_OPPORTUNITY
```

## OPPORTUNITY-01 List Opportunities

```http
GET /api/v1/opportunities
```

Filters:

- type
- location
- deadline
- skill
- search
- verification status

## OPPORTUNITY-02 Get Opportunity

```http
GET /api/v1/opportunities/:opportunityId
```

## OPPORTUNITY-03 Create Opportunity

```http
POST /api/v1/opportunities
```

## OPPORTUNITY-04 Update Opportunity

```http
PATCH /api/v1/opportunities/:opportunityId
```

## OPPORTUNITY-05 Delete Opportunity

```http
DELETE /api/v1/opportunities/:opportunityId
```

## OPPORTUNITY-06 Verify Opportunity

```http
PATCH /api/v1/opportunities/:opportunityId/verify
```

## OPPORTUNITY-07 Add Risk Signal

```http
POST /api/v1/opportunities/:opportunityId/risk-signals
```

Store evidence-based indicators.

Do not automatically label an opportunity fraudulent.

## OPPORTUNITY-08 Student Saved Opportunities

```http
GET /api/v1/students/me/saved-opportunities
```

The save/toggle operation may be implemented as:

```http
POST /api/v1/opportunities/:opportunityId/save
```

This endpoint should therefore be included in the implementation even
though the original count table groups saved-opportunity functionality
with student opportunity APIs.

---

# 65. Interview Module

AI interview generation/evaluation is deferred.

The backend must still manage interview sessions.

## INTERVIEW-01 List Interview Roles

```http
GET /api/v1/interviews/roles
```

## INTERVIEW-02 Start Interview

```http
POST /api/v1/interviews
```

Request:

```json
{
  "careerId": "career-id",
  "difficulty": "MEDIUM"
}
```

## INTERVIEW-03 Get Interview Session

```http
GET /api/v1/interviews/:interviewId
```

## INTERVIEW-04 Submit Answer

```http
POST /api/v1/interviews/:interviewId/answers
```

## INTERVIEW-05 Complete Interview

```http
POST /api/v1/interviews/:interviewId/complete
```

## INTERVIEW-06 Get Interview Result

```http
GET /api/v1/interviews/:interviewId/result
```

## INTERVIEW-07 Student Interview History

```http
GET /api/v1/students/me/interviews
```

Phase 1 can store answers and return placeholder evaluation fields.

Do not generate fake AI scores.

---

# 65. Notifications Module

## NOTIFY-01 List Notifications

```http
GET /api/v1/notifications
```

## NOTIFY-02 Mark Notification Read

```http
PATCH /api/v1/notifications/:notificationId/read
```

## NOTIFY-03 Mark All Read

```http
PATCH /api/v1/notifications/read-all
```

## NOTIFY-04 Get Unread Count

```http
GET /api/v1/notifications/unread-count
```

---

# 65. Settings Module

## SETTINGS-01 Get Settings

```http
GET /api/v1/settings
```

## SETTINGS-02 Update Settings

```http
PATCH /api/v1/settings
```

## SETTINGS-03 Change Password

```http
PATCH /api/v1/settings/password
```

## SETTINGS-04 Delete Account

```http
DELETE /api/v1/settings/account
```

Account deletion should be handled safely and preferably
soft-delete/anonymization where legally appropriate.

---

# 65. Files Module

## FILE-01 Upload File

```http
POST /api/v1/files/upload
```

Use multipart form data.

Validate:

- MIME type
- extension
- file size
- filename
- authorization

## FILE-02 Get File Metadata

```http
GET /api/v1/files/:fileId
```

## FILE-03 Delete File

```http
DELETE /api/v1/files/:fileId
```

Never expose raw storage credentials.

Use signed URLs for private files.

---

# 65. Admin Module

Admin frontend requires management interfaces for:

- users
- resources
- careers
- skills
- assessments
- community
- opportunities
- audit logs

## ADMIN-01 Dashboard

```http
GET /api/v1/admin/dashboard
```

Return:

- total users
- active users
- resources
- posts
- opportunities
- pending moderation
- recent activity

## ADMIN-02 List Users

```http
GET /api/v1/admin/users
```

## ADMIN-03 Update User

```http
PATCH /api/v1/admin/users/:userId
```

Possible actions:

- activate
- deactivate
- change role
- verify

## ADMIN-04 List Moderation Reports

```http
GET /api/v1/admin/reports
```

## ADMIN-05 Resolve Report

```http
PATCH /api/v1/admin/reports/:reportId
```

## ADMIN-06 Manage Careers

```http
POST /api/v1/admin/careers
```

## ADMIN-07 Update Career

```http
PATCH /api/v1/admin/careers/:careerId
```

## ADMIN-08 Manage Skills

```http
POST /api/v1/admin/skills
```

## ADMIN-09 Update Skill

```http
PATCH /api/v1/admin/skills/:skillId
```

## ADMIN-10 Audit Logs

```http
GET /api/v1/admin/audit-logs
```

---

# 65. Faculty Module

## FACULTY-01 Faculty Dashboard

```http
GET /api/v1/faculty/dashboard
```

## FACULTY-02 Create Assessment

```http
POST /api/v1/faculty/assessments
```

## FACULTY-03 Upload Academic Resource

```http
POST /api/v1/faculty/resources
```

## FACULTY-04 Learning Analytics

```http
GET /api/v1/faculty/analytics
```

Analytics must only expose students/data the faculty role is authorized
to access.

---

# 65. Audit Module

Every important security/admin event must be auditable.

## AUDIT-01 Get Audit Logs

```http
GET /api/v1/audit-logs
```

Admin only.

## AUDIT-02 Get Audit Log Detail

```http
GET /api/v1/audit-logs/:logId
```

Record:

```text
userId
action
resourceType
resourceId
timestamp
IP if appropriate
result
metadata
```

Never log passwords, tokens or sensitive secrets.

---

# 65. Database Design

Recommended MongoDB collections/models:

```text
User
Role
RefreshSession
StudentProfile
AcademicProfile
Career
CareerGoal
Skill
SkillRelation
CareerSkill
StudentSkill
StudentSkillHistory
Assessment
AssessmentQuestion
AssessmentAttempt
AssessmentAnswer
AssessmentResult
Roadmap
RoadmapStep
Resource
ResourceProgress
JobAnalysis
JobSkill
CommunityPost
CommunityComment
CommunityLike
CommunityReport
SeniorExperience
Opportunity
OpportunitySkill
OpportunityRiskSignal
SavedOpportunity
InterviewSession
InterviewQuestion
InterviewAnswer
InterviewResult
Notification
UserSettings
File
AuditLog
```

---

# 65. Important Database Relationships

## User

```text
User
 ├── StudentProfile
 ├── AcademicProfile
 ├── CareerGoals
 ├── StudentSkills
 ├── Assessments
 ├── Roadmaps
 ├── Resources
 ├── CommunityPosts
 ├── SeniorExperiences
 ├── Interviews
 ├── Notifications
 └── Settings
```

## Career

```text
Career
 ├── CareerSkills
 └── CareerGoals
```

## Skill

```text
Skill
 ├── Parent Skill
 ├── Child Skills
 ├── CareerSkill
 └── StudentSkill
```

---

# 65. Student Skill Model

Do not permanently store only:

```text
DSA = 5/10
```

Store structured state:

```text
StudentSkill
- studentId
- skillId
- proficiency
- confidence
- source
- lastAssessedAt
- updatedAt
```

Possible source:

```text
MANUAL
ASSESSMENT
INTERVIEW
ADMIN
SYSTEM
```

The future knowledge-tracing model can replace the calculation without
changing the API contract.

---

# 65. Skill Gap Model

The initial backend can calculate:

```text
gap = requiredLevel - currentLevel
```

Example:

```text
Spring Boot
Current = 2
Required = 4
Gap = 2
```

Priority can initially consider:

```text
career importance
current level
required level
prerequisites
```

Later ML ranking can replace this.

---

# 65. Roadmap Generation

Phase 1:

Use deterministic logic.

Example:

```text
if Java >= required
and Spring < required:
    recommend Spring

if Spring is blocked by OOP:
    recommend OOP first
```

The roadmap service must:

1.  read career requirements
2.  read student skills
3.  identify gaps
4.  resolve prerequisites
5.  order learning steps
6.  create/update roadmap
7.  persist roadmap version

Future AI recommendation models should plug into:

```text
RecommendationEngine
```

without changing frontend APIs.

---

# 65. AI/RAG/ML Boundary

The backend must have clear interfaces for future AI services.

Create interfaces such as:

```text
SkillEstimationEngine
RecommendationEngine
SemanticMatchingEngine
KnowledgeRetrievalEngine
CommunityIntelligenceEngine
OpportunityRiskEngine
InterviewEvaluationEngine
```

Phase 1 implementations:

```text
RuleBasedSkillEstimator
RuleBasedRecommendationEngine
KeywordJobMatcher
BasicResourceSearch
BasicCommunitySimilarity
ManualRiskSignals
PlaceholderInterviewEvaluator
```

Later:

```text
MLSkillEstimator
EmbeddingJobMatcher
RAGKnowledgeEngine
MLRecommendationEngine
NLPCommunityEngine
RiskClassifier
LLMInterviewEvaluator
```

This allows AI to be added without rewriting controllers.

---

# 65. Security Requirements

Security is a first-class backend requirement.

## Authentication

- strong password hashing
- JWT access tokens
- refresh-token rotation
- token expiry
- logout/session invalidation

## Authorization

Use RBAC guards.

Example:

```text
Student → own profile
Senior → own experiences
Faculty → academic resources/authorized analytics
Moderator → moderation
Admin → system administration
```

## Input Security

Validate every request DTO.

Protect against:

- SQL injection
- XSS
- malicious HTML
- oversized payloads
- malicious file uploads

## Rate Limiting

Protect:

```text
login
register
forgot-password
community posting
comments
job analysis
file upload
interview endpoints
```

## File Security

- MIME validation
- extension validation
- file size limits
- random storage keys
- signed URLs
- no executable uploads
- virus scanning hook for future implementation

---

# 65. Authorization Rules

The backend must NEVER rely on frontend restrictions.

For example:

```text
Student A
```

must not be able to:

```text
GET /students/student-B/profile
```

unless explicitly authorized.

Likewise:

- students cannot edit careers
- students cannot verify senior experiences
- students cannot resolve reports
- faculty cannot access admin operations
- seniors cannot modify another senior's experience

Authorization must be enforced server-side.

---

# 65. Pagination

All list endpoints should support:

```text
?page=1&limit=20
```

Maximum limit:

```text
100
```

Default:

```text
20
```

Use consistent pagination responses.

---

# 65. Search and Filtering

Support basic database-backed search initially.

Examples:

```text
GET /careers?search=software
GET /resources?skill=java
GET /opportunities?type=INTERNSHIP
GET /community/posts?category=DSA
GET /senior-experiences?company=Google
```

Semantic search will be added later.

---

# 65. API Status Codes

Use standard HTTP status codes:

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
429 Too Many Requests
500 Internal Server Error
```

---

# 65. Transactions

Use database transactions for operations such as:

### Assessment submission

```text
submit attempt
 ↓
calculate result
 ↓
save result
 ↓
update skill state
 ↓
update roadmap if required
```

All related changes should be transaction-safe.

### User registration

```text
create user
 ↓
create role/profile
 ↓
create settings
```

---

# 65. Frontend-to-Backend Mapping

The backend must directly support the frontend routes.

Frontend Backend

---

`/login` Auth
`/signup` Auth
`/onboarding` Users + Students + Careers
`/dashboard` Student dashboard aggregation
`/profile` Student profile
`/skills` Skills
`/careers` Careers
`/careers/:id` Career detail
`/roadmap` Roadmaps
`/assessment` Assessments
`/assessment/:id` Assessment attempts
`/assessment/:id/result` Assessment results
`/resources` Resources
`/resources/:id` Resource detail
`/assistant` Future RAG/Knowledge module
`/job-analyzer` Job analysis
`/opportunities` Opportunities
`/community` Community
`/seniors` Senior experiences
`/interview` Interviews
`/settings` Settings
`/admin` Admin
`/faculty` Faculty
`/senior` Senior

---

# 65. Dashboard Aggregation

The frontend dashboard should not make 15 independent requests if
avoidable.

Provide:

```http
GET /api/v1/students/me/dashboard
```

Return:

```json
{
  "student": {},
  "career": {},
  "careerMatch": {},
  "strongSkills": [],
  "weakSkills": [],
  "missingSkills": [],
  "nextAction": {},
  "roadmapPreview": [],
  "recentActivity": [],
  "recommendedOpportunities": []
}
```

This is a backend-for-frontend style aggregation while still keeping the
application a modular monolith.

---

# 65. Career Detail Aggregation

Provide:

```http
GET /api/v1/careers/:careerId/overview
```

Return:

```text
career
required skills
preferred skills
skill graph
student match
student gaps
recommended roadmap
```

This reduces frontend complexity.

---

# 65. Assessment Result Aggregation

Return:

```text
overall score
topic scores
skill scores
weak areas
strong areas
recommended next steps
```

The frontend should never need to calculate these from raw answers.

---

# 65. Resource Progress

Track:

```text
studentId
resourceId
startedAt
completedAt
progressPercentage
lastAccessedAt
```

This allows future personalized recommendations.

---

# 65. Community Moderation

Community reports must follow:

```text
POST
 ↓
REPORT
 ↓
MODERATION QUEUE
 ↓
MODERATOR
 ↓
ACTION
 ↓
AUDIT LOG
```

Possible actions:

```text
DISMISS
HIDE
REMOVE
WARN_USER
SUSPEND_USER
```

Every moderation action must be auditable.

---

# 65. Opportunity Verification

Opportunity states:

```text
PENDING
VERIFIED
REJECTED
EXPIRED
```

Risk indicators are separate from verification.

Do not implement:

```text
AI says fraud = fraud
```

Instead:

```text
Risk signals
+
Evidence
+
Verification status
```

---

# 65. Senior Verification

Senior verification should support:

```text
PENDING
VERIFIED
REJECTED
```

Verification evidence can include:

- college email
- alumni record
- faculty/admin verification

Do not expose private verification documents publicly.

---

# 65. API Documentation

Generate Swagger documentation automatically.

Every endpoint must have:

- summary
- description
- request schema
- response schema
- authentication requirement
- role requirement
- error responses

Swagger route:

```text
/api/docs
```

---

# 65. Environment Variables

Use:

```text
NODE_ENV
PORT
DATABASE_URL

JWT_ACCESS_SECRET
JWT_ACCESS_EXPIRES_IN
JWT_REFRESH_SECRET
JWT_REFRESH_EXPIRES_IN

REDIS_URL

S3_ENDPOINT
S3_BUCKET
S3_REGION
S3_ACCESS_KEY
S3_SECRET_KEY

CORS_ORIGIN

RATE_LIMIT_TTL
RATE_LIMIT_LIMIT
```

Never commit secrets.

Provide:

```text
.env.example
```

---

# 65. Docker

Provide:

```text
Dockerfile
docker-compose.yml
```

Development stack:

```text
careergraph-api
postgres
redis
```

Object storage can use an S3-compatible service locally if required.

---

# 65. Database Migration

The project must provide:

```text
initial migration
seed script
```

Seed data should include:

### Careers

```text
Software Engineer
Backend Developer
Data Analyst
Data/ML Engineer
Cybersecurity Analyst
Management/MBA
Competitive Examination
```

### Skills

Examples:

```text
Programming
Java
Python
JavaScript
DSA
OOP
SQL
DBMS
OS
Computer Networks
REST
Spring Boot
Git
Docker
Cloud
System Design
Linux
```

### Assessment

Create a small realistic question bank.

### Resources

Create mock college resources.

### Opportunities

Create mock opportunities.

### Community

Create realistic sample posts.

### Senior experiences

Create verified sample experiences.

---

# 65. Testing Requirements

Write unit tests for:

- auth service
- password validation
- career service
- skill-gap service
- assessment scoring
- roadmap generation
- authorization
- opportunity verification
- moderation

Integration tests for:

```text
register → login
login → refresh
assessment → result → skill update
career → skill gap → roadmap
community → report → moderation
resource upload → resource access
```

---

# 65. Security Testing

Test:

- unauthorized access
- IDOR
- invalid JWT
- expired JWT
- role escalation
- malformed DTOs
- oversized payload
- malicious filenames
- unsupported file types
- rate-limit behavior
- SQL injection payloads
- XSS payloads

---

# 65. Performance Requirements

For normal CRUD operations:

```text
Target p95 < 500 ms
```

for normal local/deployed prototype conditions, excluding heavy AI
operations.

AI/RAG operations later may be asynchronous.

Use Redis caching for:

- career lists
- skill taxonomy
- public resources
- frequently accessed metadata

Invalidate cache when admin modifies relevant data.

---

# 65. Async Jobs

Do not block HTTP requests for heavy future operations.

Prepare a worker abstraction for:

```text
document processing
AI analysis
email
notifications
future recommendation jobs
```

A queue such as BullMQ can be introduced when required.

---

# 65. Audit Events

Log:

```text
USER_LOGIN
USER_LOGOUT
PASSWORD_CHANGED
ROLE_CHANGED
PROFILE_UPDATED
RESOURCE_CREATED
RESOURCE_DELETED
CAREER_UPDATED
SKILL_UPDATED
ASSESSMENT_SUBMITTED
ROADMAP_UPDATED
POST_REPORTED
POST_MODERATED
OPPORTUNITY_VERIFIED
SENIOR_EXPERIENCE_VERIFIED
FILE_UPLOADED
FILE_DELETED
```

---

# 65. Soft Delete

Use soft deletion where historical integrity matters.

Recommended:

```text
User
CommunityPost
Resource
Opportunity
SeniorExperience
Career
Skill
```

Use:

```text
deletedAt
```

rather than immediately destroying records.

---

# 65. API Versioning

Use:

```text
/api/v1
```

Do not place version numbers inside individual module names.

Future breaking changes should become:

```text
/api/v2
```

---

# 65. Backend Development Phases

## Phase 1 --- Foundation

Build:

- Express.js project
- configuration
- Mongoose
- MongoDB
- Redis
- Swagger
- validation
- error handling
- logging
- Docker

## Phase 2 --- Authentication

Build:

- registration
- login
- refresh
- logout
- verification
- password reset
- RBAC

## Phase 3 --- Student

Build:

- profile
- academic data
- projects
- career goals
- settings

## Phase 4 --- Career + Skills

Build:

- career CRUD
- skill taxonomy
- career-skill relationships
- student skills
- skill gap

## Phase 5 --- Assessment

Build:

- assessments
- questions
- attempts
- answers
- scoring
- skill updates

## Phase 6 --- Roadmap

Build:

- roadmap generation
- roadmap steps
- progress
- roadmap history

## Phase 7 --- Resources

Build:

- resources
- file uploads
- progress
- college resources

## Phase 8 --- Community

Build:

- posts
- comments
- likes
- reports
- moderation

## Phase 9 --- Seniors + Opportunities

Build:

- senior experiences
- verification
- opportunities
- saving
- verification
- risk signals

## Phase 10 --- Job + Interview Data Layer

Build:

- job analysis storage
- structured extraction baseline
- interview sessions
- answers
- results data model

## Phase 11 --- Admin + Faculty

Build:

- dashboards
- user management
- moderation
- careers
- skills
- assessments
- resources
- analytics

## Phase 12 --- Hardening

Build:

- tests
- security
- rate limits
- audit
- caching
- performance
- deployment

## Phase 13 --- AI Integration Later

Only after the backend is stable:

- RAG
- embeddings
- semantic job matching
- knowledge tracing
- recommendations
- community NLP
- opportunity risk model
- AI interview evaluation

---

# 65. Important AI Deferral Rule

During the current backend implementation:

DO NOT:

- train ML models
- call LLM APIs
- generate embeddings
- build vector databases
- implement RAG retrieval
- claim AI-generated scores
- claim semantic job matching
- claim AI fraud detection
- generate fake interview evaluations

Instead, create clean interfaces and database structures so these can be
added later.

---

# 65. Definition of Done

The backend is considered complete for Phase 1 when:

- all core endpoints are implemented
- Swagger documents all endpoints
- MongoDB schema is migrated
- seed data exists
- JWT authentication works
- RBAC works
- student frontend can log in
- onboarding can save profile data
- dashboard can load
- career pages can load
- skills can load
- assessments can be completed
- results can be calculated
- student skill state can update
- skill gaps can be calculated
- roadmap can be generated
- resources can be browsed
- community can be used
- senior experiences can be browsed/created
- opportunities can be browsed/saved
- job descriptions can be stored
- interview sessions can be stored
- admin operations work
- faculty operations work
- file uploads work
- audit logs work
- validation works
- authorization works
- rate limiting works
- tests cover critical business logic
- no AI functionality is falsely represented as implemented

---

# 65. MASTER IMPLEMENTATION PROMPT FOR CODING AGENT

Use the following prompt after the frontend is ready.

```text
Build the complete CareerGraph backend as a production-quality modular monolith.

IMPORTANT:
This phase is BACKEND ONLY.

Do not redesign the frontend.
Do not remove existing frontend routes.
Do not replace frontend mock data until API integration is explicitly requested.

The backend must be compatible with the existing CareerGraph frontend.

==================================================
ARCHITECTURE
==================================================

Use:

- Express.js
- TypeScript
- MongoDB
- Mongoose
- Redis
- JWT
- REST
- Swagger/OpenAPI
- Docker

Build a MODULAR MONOLITH using Express.js.

Do NOT create microservices.

Use a feature/module-oriented folder structure inside one Express application.

Modules:

auth
users
students
careers
skills
assessments
roadmaps
resources
jobs
community
seniors
opportunities
interviews
notifications
settings
admin
faculty
files
audit

Keep each module isolated internally with:

controller
service
repository
dto
policies
tests

Use dependency injection through explicit service construction/factories where useful; keep modules loosely coupled.

==================================================
API
==================================================

Base prefix:

/api/v1

Create approximately 120 REST endpoints covering:

Authentication
Student profile
Academic profile
Career goals
Careers
Skills
Skill graphs
Skill gaps
Assessments
Assessment attempts
Assessment results
Roadmaps
Resources
Job analyses
Community
Senior experiences
Opportunities
Interviews
Notifications
Settings
Files
Admin
Faculty
Audit

Document every endpoint with Swagger.

==================================================
AUTHENTICATION
==================================================

Implement:

POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/logout-all
POST /api/v1/auth/verify-email
POST /api/v1/auth/resend-verification
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
GET /api/v1/auth/me

Use secure password hashing.

Use short-lived access tokens.

Use refresh-token rotation.

Do not store plaintext passwords.

==================================================
RBAC
==================================================

Roles:

STUDENT
SENIOR
MENTOR
FACULTY
MODERATOR
ADMIN

Implement server-side authorization guards.

Never rely on frontend authorization.

Prevent users from accessing another user's private resources.

==================================================
STUDENT
==================================================

Implement:

GET /api/v1/users/me
PATCH /api/v1/users/me
GET /api/v1/students/me/academic
PATCH /api/v1/students/me/academic
GET /api/v1/students/me/profile
PATCH /api/v1/students/me/career-goals
POST /api/v1/students/me/projects
DELETE /api/v1/students/me/projects/:projectId

Also provide dashboard aggregation:

GET /api/v1/students/me/dashboard

Return:
student
career
career match
strong skills
weak skills
missing skills
next action
roadmap preview
recent activity
recommended opportunities

==================================================
CAREERS
==================================================

Implement:

GET /api/v1/careers
GET /api/v1/careers/:careerId
GET /api/v1/careers/:careerId/skills
GET /api/v1/careers/:careerId/skill-graph
POST /api/v1/students/me/career-goals
DELETE /api/v1/students/me/career-goals/:careerGoalId
GET /api/v1/students/me/career-goals

Seed:

Software Engineer
Backend Developer
Data Analyst
Data/ML Engineer
Cybersecurity Analyst
Management/MBA
Competitive Examination

==================================================
SKILLS
==================================================

Implement:

GET /api/v1/skills
GET /api/v1/skills/:skillId
GET /api/v1/skills/:skillId/children
GET /api/v1/skills/graph
GET /api/v1/students/me/skills
PATCH /api/v1/students/me/skills/:skillId
GET /api/v1/students/me/skills/:skillId/history
GET /api/v1/students/me/skill-gaps

Create parent/child skill relationships.

Seed skills relevant to the supported careers.

==================================================
ASSESSMENTS
==================================================

Implement:

GET /api/v1/assessments
GET /api/v1/assessments/:assessmentId
GET /api/v1/assessments/:assessmentId/questions
POST /api/v1/assessments/:assessmentId/attempts
GET /api/v1/assessment-attempts/:attemptId
POST /api/v1/assessment-attempts/:attemptId/answers
POST /api/v1/assessment-attempts/:attemptId/submit
GET /api/v1/assessment-attempts/:attemptId/result
GET /api/v1/students/me/assessments
GET /api/v1/students/me/assessment-weak-areas

Never send correct answers to the student.

Calculate objective scores server-side.

After submission:
save result
calculate topic performance
calculate skill performance
update structured student skill state

Use transactions.

==================================================
ROADMAP
==================================================

Implement:

GET /api/v1/students/me/roadmap
POST /api/v1/students/me/roadmap/generate
GET /api/v1/roadmap-steps/:stepId
PATCH /api/v1/roadmap-steps/:stepId
POST /api/v1/roadmap-steps/:stepId/complete
GET /api/v1/students/me/roadmap/history
POST /api/v1/students/me/roadmap/recalculate

For now use deterministic/rule-based roadmap generation.

Use career skills + prerequisites + student skill state.

Do not claim this is AI recommendation.

Create a RecommendationEngine interface so an ML implementation can replace it later.

==================================================
RESOURCES
==================================================

Implement:

GET /api/v1/resources
GET /api/v1/resources/:resourceId
POST /api/v1/resources
PATCH /api/v1/resources/:resourceId
DELETE /api/v1/resources/:resourceId
POST /api/v1/resources/:resourceId/access
POST /api/v1/resources/:resourceId/complete
GET /api/v1/students/me/resources/history

Support:
PDF
VIDEO
ARTICLE
COURSE
PRACTICE
PROJECT
NOTE
SYLLABUS
LAB_MANUAL
QUESTION_PAPER

Use S3-compatible storage.

Store metadata in MongoDB.

==================================================
AI/RAG PREPARATION
==================================================

Do NOT implement LLM/RAG now.

Create resource/document metadata that can later support RAG.

Create an abstraction such as:

KnowledgeRetrievalEngine

Do not call an AI provider.

If the frontend calls a future AI endpoint before integration, return a clear controlled response such as:

AI_NOT_ENABLED

Never fake an AI response.

==================================================
JOB ANALYZER
==================================================

Implement:

POST /api/v1/job-analyses
GET /api/v1/job-analyses/:analysisId
GET /api/v1/students/me/job-analyses
POST /api/v1/job-analyses/:analysisId/analyze
POST /api/v1/job-analyses/:analysisId/add-to-roadmap

Store:
job title
description
source
skills
analysis status
createdAt

Phase 1 can use basic deterministic keyword extraction if needed.

Do NOT claim semantic AI matching.

Create:

SemanticMatchingEngine

as an interface for future embedding/ML implementation.

==================================================
COMMUNITY
==================================================

Implement:

GET /api/v1/community/posts
GET /api/v1/community/posts/:postId
POST /api/v1/community/posts
PATCH /api/v1/community/posts/:postId
DELETE /api/v1/community/posts/:postId
POST /api/v1/community/posts/:postId/comments
GET /api/v1/community/posts/:postId/comments
POST /api/v1/community/posts/:postId/like
POST /api/v1/community/posts/:postId/report
GET /api/v1/community/posts/:postId/similar

Use normal database filtering/tag matching initially.

Do not implement NLP or embeddings yet.

==================================================
SENIORS
==================================================

Implement:

GET /api/v1/senior-experiences
GET /api/v1/senior-experiences/:experienceId
POST /api/v1/senior-experiences
PATCH /api/v1/senior-experiences/:experienceId
DELETE /api/v1/senior-experiences/:experienceId
PATCH /api/v1/senior-experiences/:experienceId/verify

Only authorized roles can verify.

==================================================
OPPORTUNITIES
==================================================

Implement:

GET /api/v1/opportunities
GET /api/v1/opportunities/:opportunityId
POST /api/v1/opportunities
PATCH /api/v1/opportunities/:opportunityId
DELETE /api/v1/opportunities/:opportunityId
PATCH /api/v1/opportunities/:opportunityId/verify
POST /api/v1/opportunities/:opportunityId/risk-signals
GET /api/v1/students/me/saved-opportunities
POST /api/v1/opportunities/:opportunityId/save

Risk signals must be evidence-based.

Do not automatically declare an opportunity fraudulent.

==================================================
INTERVIEW
==================================================

Implement the data layer:

GET /api/v1/interviews/roles
POST /api/v1/interviews
GET /api/v1/interviews/:interviewId
POST /api/v1/interviews/:interviewId/answers
POST /api/v1/interviews/:interviewId/complete
GET /api/v1/interviews/:interviewId/result
GET /api/v1/students/me/interviews

Do not implement LLM interview generation/evaluation.

Store questions, answers and result placeholders.

Never fabricate AI scores.

==================================================
NOTIFICATIONS
==================================================

Implement:

GET /api/v1/notifications
PATCH /api/v1/notifications/:notificationId/read
PATCH /api/v1/notifications/read-all
GET /api/v1/notifications/unread-count

==================================================
SETTINGS
==================================================

Implement:

GET /api/v1/settings
PATCH /api/v1/settings
PATCH /api/v1/settings/password
DELETE /api/v1/settings/account

==================================================
FILES
==================================================

Implement:

POST /api/v1/files/upload
GET /api/v1/files/:fileId
DELETE /api/v1/files/:fileId

Use secure object storage.

Validate MIME type and file size.

Use signed URLs for private files.

==================================================
ADMIN
==================================================

Implement:

GET /api/v1/admin/dashboard
GET /api/v1/admin/users
PATCH /api/v1/admin/users/:userId
GET /api/v1/admin/reports
PATCH /api/v1/admin/reports/:reportId
POST /api/v1/admin/careers
PATCH /api/v1/admin/careers/:careerId
POST /api/v1/admin/skills
PATCH /api/v1/admin/skills/:skillId
GET /api/v1/admin/audit-logs

==================================================
FACULTY
==================================================

Implement:

GET /api/v1/faculty/dashboard
POST /api/v1/faculty/assessments
POST /api/v1/faculty/resources
GET /api/v1/faculty/analytics

Enforce faculty authorization.

==================================================
AUDIT
==================================================

Implement:

GET /api/v1/audit-logs
GET /api/v1/audit-logs/:logId

Record important security and administration actions.

Never record:
passwords
tokens
secrets

==================================================
DATABASE
==================================================

Create Mongoose schemas/models for:

User
Role
RefreshSession
StudentProfile
AcademicProfile
Career
CareerGoal
Skill
SkillRelation
CareerSkill
StudentSkill
StudentSkillHistory
Assessment
AssessmentQuestion
AssessmentAttempt
AssessmentAnswer
AssessmentResult
Roadmap
RoadmapStep
Resource
ResourceProgress
JobAnalysis
JobSkill
CommunityPost
CommunityComment
CommunityLike
CommunityReport
SeniorExperience
Opportunity
OpportunitySkill
OpportunityRiskSignal
SavedOpportunity
InterviewSession
InterviewQuestion
InterviewAnswer
InterviewResult
Notification
UserSettings
File
AuditLog

Add:
foreign keys
indexes
unique constraints
createdAt
updatedAt
deletedAt where appropriate

Use transactions for multi-step operations.

==================================================
SECURITY
==================================================

Implement:

JWT authentication
refresh token rotation
RBAC
DTO validation
rate limiting
Helmet
CORS
secure headers
safe file uploads
authorization guards
audit logging

Protect against:
IDOR
XSS
SQL injection
mass assignment
oversized requests
malicious uploads

Never trust frontend-provided:
userId
role
score
permissions

==================================================
API QUALITY
==================================================

Every endpoint must have:

DTO
validation
authorization
Swagger documentation
proper HTTP status
consistent response format
error handling

Implement pagination on list endpoints.

Default:
limit = 20

Maximum:
limit = 100

==================================================
MOCK DATA
==================================================

Create seed data for:

7 careers
20–30 skills
career-skill relationships
sample assessments
sample questions
sample resources
sample community posts
sample senior experiences
sample opportunities

Create demo users for:
student
senior
faculty
moderator
admin

Use development-only credentials and clearly mark them as seed data.

==================================================
TESTING
==================================================

Create unit tests for:

authentication
authorization
skill-gap calculation
assessment scoring
roadmap generation
moderation
opportunity verification

Create integration/e2e tests for:

register/login
refresh/logout
assessment submission
skill update
skill gap
roadmap generation
community posting
reporting
opportunity verification
resource access

==================================================
DOCKER
==================================================

Create:

Dockerfile
docker-compose.yml
.env.example

Services:

API
MongoDB
Redis

==================================================
OUTPUT
==================================================

Generate a complete runnable backend.

Do not leave core endpoints as TODO.

AI-dependent features must have clean interfaces but must not pretend to be implemented.

At the end provide:

1. folder structure
2. database schema
3. migration instructions
4. seed instructions
5. environment variables
6. API documentation location
7. endpoint list
8. test commands
9. Docker commands
10. explanation of how the existing CareerGraph frontend maps to each API

The final backend must be modular, secure, testable, maintainable and ready for later AI/RAG/ML integration.
```

---

# 65. Recommended Backend Implementation Order

Do **not** build all 121 endpoints randomly.

Build them in this order:

```text
                    BACKEND
                       │
                       ▼
              ┌─────────────────┐
              │ 1. FOUNDATION   │
              │ Express.js/Postgres │
              │ Mongoose/Redis    │
              └────────┬────────┘
                       ↓
              ┌─────────────────┐
              │ 2. AUTH + RBAC  │
              └────────┬────────┘
                       ↓
              ┌─────────────────┐
              │ 3. STUDENT      │
              │ PROFILE         │
              └────────┬────────┘
                       ↓
              ┌─────────────────┐
              │ 4. CAREER       │
              │ + SKILLS        │
              └────────┬────────┘
                       ↓
              ┌─────────────────┐
              │ 5. ASSESSMENT   │
              └────────┬────────┘
                       ↓
              ┌─────────────────┐
              │ 6. SKILL GAP    │
              │ + ROADMAP       │
              └────────┬────────┘
                       ↓
              ┌─────────────────┐
              │ 7. RESOURCES    │
              └────────┬────────┘
                       ↓
              ┌─────────────────┐
              │ 8. COMMUNITY    │
              └────────┬────────┘
                       ↓
              ┌─────────────────┐
              │ 9. SENIORS      │
              │ + OPPORTUNITIES │
              └────────┬────────┘
                       ↓
              ┌─────────────────┐
              │10. JOBS         │
              │ + INTERVIEW     │
              └────────┬────────┘
                       ↓
              ┌─────────────────┐
              │11. ADMIN/FACULTY│
              └────────┬────────┘
                       ↓
              ┌─────────────────┐
              │12. SECURITY +   │
              │ TESTING         │
              └────────┬────────┘
                       ↓
                 READY FOR AI
```

The key architectural decision is: **build the backend contracts now,
but keep AI implementations behind interfaces**. That means when you
later add RAG, embeddings, knowledge tracing, recommendation models and
AI interview evaluation, the frontend doesn't have to be rebuilt and the
core backend doesn't have to be rewritten.

The document above is deliberately based on your existing CareerGraph
FRD and the frontend page structure, while leaving the AI/RAG/ML
intelligence for the later phase. fileciteturn0file0L1450-L1531
fileciteturn0file0L1843-L1884
