# CareerGraph — Security Implementation Report

## 1. Authentication & Session Security
- **Dual Token Architecture**:
  - Short-lived JWT access tokens (15-minute expiration) carrying essential claims (`userId`, `email`, `roles`).
  - Cryptographically secure 64-byte random refresh tokens (7-day sliding expiration) stored as SHA-256 hashes in MongoDB.
- **Refresh Token Rotation & Reuse Detection**:
  - Every refresh token exchange automatically invalidates the consumed token and issues a new pair.
  - If an already-invalidated refresh token is presented, the system detects a token theft attempt, immediately revoking all active sessions for that user.
- **Password Security**:
  - Salted and hashed using `bcrypt` (10 rounds in production/staging).
  - Password fields have `select: false` on the Mongoose schema to prevent leakage in generic queries.
  - Password rotation immediately invalidates all active refresh sessions.

---

## 2. Insecure Direct Object Reference (IDOR) Protections
- **User-Scoped Queries**: All student-specific endpoints (`/students/me/*`, `/roadmap-steps/*`, `/interviews/*`, `/settings/*`, `/files/*`) resolve the resource ownership strictly through `req.user.userId`.
- **Foreign Access Guard**: Even if an ID is passed in the URL (e.g. `/interviews/:sessionId`), the service verifies that `session.userId.toString() === req.user.userId`. If unauthorized, the request is rejected with HTTP 403 or 404 to prevent resource discovery.

---

## 3. Role-Based Access Control (RBAC) & Hierarchy
Role hierarchy enforced:
`STUDENT` < `SENIOR` / `MENTOR` < `FACULTY` < `MODERATOR` < `ADMIN`

- Multi-role support allows users to hold multiple roles simultaneously (e.g., `STUDENT` and `SENIOR`).
- `authorize(...allowedRoles)` middleware checks that the user's active roles array satisfies at least one required role.
- Faculty cannot execute Admin endpoints (`/api/v1/admin/*`).
- Students cannot access Faculty, Moderation, or Admin endpoints.

---

## 4. Injection & Input Sanitization
- **NoSQL Injection Resistance**:
  - Express JSON body is validated against explicit DTO classes using `class-validator`.
  - Unknown fields are stripped (`whitelist: true`), and unexpected non-whitelisted properties can be rejected (`forbidNonWhitelisted: true`).
  - Mongoose queries strictly cast arguments according to defined schema types.
- **XSS & HTTP Header Protections**:
  - `helmet` middleware sets secure headers: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and removes `X-Powered-By`.
  - CORS strictly configured to trusted client origins.

---

## 5. Rate Limiting & Abuse Prevention
- **General Rate Limiter**: 100 requests per 15 minutes per IP.
- **Auth Endpoint Limiter**: 10 attempts per 15 minutes on `/auth/login`, `/auth/register`, and `/auth/forgot-password`.
- **Upload Limits**: File uploads require signed URLs with enforced content type and byte size ceilings (e.g., 5MB for avatars, 10MB for resumes, 50MB for project artifacts).
