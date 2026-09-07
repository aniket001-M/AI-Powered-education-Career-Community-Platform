# CareerGraph — Backend Documentation Index

Welcome to the comprehensive backend documentation for the CareerGraph platform.

## Complete Deliverables Directory

1. [01. Architecture Map](./01_ARCHITECTURE_MAP.md)
   - High-level modular monolith system diagram
   - Directory and component structure
   - Request and error handling pipeline

2. [02. API Route Catalog](./02_API_ROUTE_CATALOG.md)
   - Complete inventory of all `/api/v1` routes across 19 modules
   - HTTP verbs, authentication, RBAC authorization, DTOs, and status codes

3. [03. Database Schema Reference](./03_DATABASE_SCHEMA_REFERENCE.md)
   - Complete reference of all 39 MongoDB collections
   - Mongoose schemas, relationships, pre-find hooks, and indexes

4. [04. State-Transition Maps](./04_STATE_TRANSITION_MAPS.md)
   - Assessment attempt lifecycle & objective scoring
   - Dynamic roadmap step progression and recalculation
   - Institutional verification and community moderation workflows

5. [05. Security Implementation Report](./05_SECURITY_IMPLEMENTATION_REPORT.md)
   - JWT authentication & refresh token rotation with reuse detection
   - IDOR guards and role hierarchy enforcement
   - NoSQL injection resistance and rate limiting

6. [06. AI/RAG Integration Blueprint](./06_AI_RAG_INTEGRATION_BLUEPRINT.md)
   - Clean interface abstractions (`RecommendationEngine`, `KnowledgeRetrievalEngine`, `SemanticMatchingEngine`)
   - Controlled 501 `AI_NOT_ENABLED` responses
   - Roadmap for embedding vectors, vector DBs, and LLM plug-in

7. [07. Verification & Moderation Pipeline](./07_VERIFICATION_MODERATION_PIPELINE.md)
   - Academic resource verification flow
   - Senior experience vetting and badge assignment
   - Opportunity scam telemetry and moderation report resolution

8. [08. Demo Accounts & Verification Guide](./08_DEMO_ACCOUNTS_VERIFICATION_GUIDE.md)
   - Demo credentials for `STUDENT`, `SENIOR`, `MENTOR`, `FACULTY`, `MODERATOR`, `ADMIN`
   - Step-by-step interactive verification guide

9. [09. Deployment & Operations Manual](./09_DEPLOYMENT_OPERATIONS_MANUAL.md)
   - Environment variables reference
   - Docker & docker-compose configurations
   - Build, seed, health-check, and logging operations

10. [10. Implementation Completeness Matrix](./10_IMPLEMENTATION_COMPLETENESS_MATRIX.md)
    - Full breakdown of Phases 1 through 11 completion status
    - Test validation results across all 22 test suites
