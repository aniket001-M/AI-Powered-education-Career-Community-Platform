# CareerGraph — Architecture Map

## 1. System Overview
CareerGraph is engineered as a **Modular Monolith** using **Node.js, Express.js, TypeScript, MongoDB, and Redis**. It is structured for high domain cohesion and loose coupling between functional modules, ensuring clean boundaries without microservice operational overhead.

```
+-------------------------------------------------------------------------------+
|                               CareerGraph API                                 |
|                            Prefix: /api/v1                                    |
+-------------------------------------------------------------------------------+
                                       |
    +----------------------------------+----------------------------------+
    |                                  |                                  |
    v                                  v                                  v
+-----------------------+   +-----------------------+   +-----------------------+
|  Identity & Accounts  |   |   Curriculum Graph    |   | Assessment & Roadmap  |
|  - Auth (AUTH-01..10) |   |  - Careers            |   |  - Assessments        |
|  - Users & Profiles   |   |  - Skills & Graph     |   |  - Scoring Engine     |
|  - RBAC & Sessions    |   |  - Student Skill State|   |  - Dynamic Roadmap    |
+-----------------------+   +-----------------------+   +-----------------------+
    |                                  |                                  |
    +----------------------------------+----------------------------------+
                                       |
    +----------------------------------+----------------------------------+
    |                                  |                                  |
    v                                  v                                  v
+-----------------------+   +-----------------------+   +-----------------------+
|  Learning & Growth    |   | Community & Ecosystem |   | Institutional & Admin |
|  - Resource Hub       |   |  - Discussion Forums  |   |  - Faculty Oversight  |
|  - Mock Interviews    |   |  - Senior Experiences |   |  - Moderation Queue   |
|  - AI/RAG Interfaces  |   |  - Opportunities & Job|   |  - Audit Logging Trail|
+-----------------------+   +-----------------------+   +-----------------------+
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   v                                       v
         +-------------------+                   +-------------------+
         |      MongoDB      |                   |       Redis       |
         | Persistent Store  |                   | Cache, Sessions,  |
         |  39 Collections   |                   | Rate-Limiter TTL  |
         +-------------------+                   +-------------------+
```

---

## 2. Directory & Module Structure
The backend codebase is organized under `src/`:
```
src/
├── common/                  # Shared kernel
│   ├── enums/               # UserRole, ResourceType, etc.
│   ├── errors/              # AppError, ErrorCode
│   ├── middleware/          # authenticate, authorize, validate, rateLimiter
│   ├── pagination/          # Paginated query utilities
│   ├── responses/           # sendSuccess, sendCreated, sendPaginated
│   └── utils/               # jwt, logger, hashing
├── config/                  # Environment & database configurations
│   ├── env.ts               # Type-safe environment variables
│   ├── database.ts          # Mongoose connection & pool config
│   └── redis.ts             # Redis client / test mock
├── models/                  # 39 Mongoose models & schemas
├── modules/                 # Self-contained domain modules
│   ├── auth/                # Authentication, token rotation, sessions
│   ├── users/               # User accounts & base identity
│   ├── students/            # Profiles, academic records, portfolio
│   ├── careers/             # Career paths, salary ranges, taxonomies
│   ├── skills/              # Skill graphs, prerequisites, gaps
│   ├── assessments/         # Question banks, attempts, evaluation
│   ├── roadmaps/            # Step generation, progress tracking
│   ├── resources/           # Learning materials & AI/RAG stubs
│   ├── jobs/                # Job analysis & keyword matching
│   ├── community/           # Forum posts, comments, reports
│   ├── seniors/             # Verified alumni experiences
│   ├── opportunities/       # Internships/jobs & risk telemetry
│   ├── interviews/          # Session recordings & rubric scoring
│   ├── notifications/       # User notifications & read tracking
│   ├── settings/            # Notification preferences & theme
│   ├── files/               # S3 upload pre-signed URL generator
│   ├── admin/               # Administrative dashboard & controls
│   ├── faculty/             # Institutional analytics & curriculum
│   └── audit/               # Security and modification audit trail
└── routes/                  # Express root router mounting all modules
```

---

## 3. Core Request Lifecycle
1. **Entry & Security Headers**: Helmet, CORS origin checking, JSON parsing, URL-encoded parsing.
2. **Rate Limiting**: `generalLimiter` or endpoint-specific `authLimiter` backed by Redis.
3. **Authentication**: `authenticate` extracts JWT bearer access token, verifies signature and expiration, populating `req.user` (`userId`, `email`, `roles`).
4. **Role Authorization**: `authorize(...allowedRoles)` verifies user role against required permission levels.
5. **DTO Validation**: `validateRequest(DtoClass, part)` applies `class-validator` and `class-transformer` rules, strictly rejecting unauthorized fields with HTTP 422.
6. **Service Layer**: Business logic execution, MongoDB atomic operations and transactions, Redis caching/invalidation.
7. **Response Envelope**: Output serialized through `sendSuccess`, `sendCreated`, or `sendPaginated`.
8. **Error Pipeline**: Unhandled exceptions and operational errors caught by `globalErrorHandler`, mapping `AppError` to unified error envelopes.
