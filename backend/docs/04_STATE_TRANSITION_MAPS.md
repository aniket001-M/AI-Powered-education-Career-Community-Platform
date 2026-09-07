# CareerGraph — State-Transition Maps

This document formalizes the lifecycle and state transitions across core entities.

## 1. Assessment Attempt Lifecycle
```
                 +-------------------+
                 |    NOT_STARTED    |
                 +-------------------+
                           |
                           | POST /assessments/:id/start
                           v
                 +-------------------+
         +-----> |    IN_PROGRESS    | <-----+
         |       +-------------------+       |
         |                 |                 | POST .../answer
         +-----------------+                 | (Update answers)
                           |
            +--------------+--------------+
            |                             |
            | POST .../submit             | Time expired / Abandoned
            v                             v
  +-------------------+         +-------------------+
  |     COMPLETED     |         | ABANDONED/EXPIRED |
  | (Objective Score) |         +-------------------+
  +-------------------+
            |
            v
  StudentSkill State Updated
  StudentSkillHistory Appended
```
- **Guarantees**:
  - Once `COMPLETED`, attempt is locked and answers cannot be modified.
  - Objective scoring strictly compares `selectedOptionId === question.correctOptionId`.
  - Skill proficiency is recalculated deterministically and clamped between 0 and 5.

---

## 2. Dynamic Roadmap Step Lifecycle
```
                 +-------------------+
                 |    NOT_STARTED    |
                 +-------------------+
                           |
                           | PATCH /roadmap-steps/:id/status
                           v
                 +-------------------+
                 |    IN_PROGRESS    |
                 +-------------------+
                           |
            +--------------+--------------+
            |                             |
            | status = COMPLETED          | status = SKIPPED
            v                             v
  +-------------------+         +-------------------+
  |     COMPLETED     |         |      SKIPPED      |
  +-------------------+         +-------------------+
            |                             |
            +--------------+--------------+
                           |
                           v
             Roadmap progressPercentage
             automatically recalculated
```
- **Recalculation Flow**:
  - When `POST /students/me/roadmap/recalculate` is triggered, the engine compares current `StudentSkill` proficiencies against `CareerSkill` target thresholds.
  - Steps for mastered skills are updated or marked complete.
  - Missing skill prerequisites generate new prerequisite steps.

---

## 3. Resource & Experience Verification Pipelines
```
                 +-------------------+
                 |      PENDING      |  (User submitted)
                 +-------------------+
                           |
            +--------------+--------------+
            |                             |
            | PATCH .../verify            | Rejected / Flagged
            v                             v
  +-------------------+         +-------------------+
  |     VERIFIED      |         |     REJECTED      |
  | (Faculty / Admin) |         +-------------------+
  +-------------------+
```
- **Rules**:
  - Resources uploaded by `FACULTY` or `ADMIN` bypass `PENDING` and enter `VERIFIED` immediately.
  - Student or peer submitted resources start as `PENDING`.
  - Senior placement experiences start unverified and earn the `isVerified: true` institutional badge once vetted by Faculty/Admin.

---

## 4. Community Moderation Report Lifecycle
```
                 +-------------------+
                 |      PENDING      |  (Post flagged by student/user)
                 +-------------------+
                           |
                           | PATCH /admin/reports/:id
                           |
            +--------------+--------------+
            |                             |
            | status = DISMISSED          | status = ACTION_TAKEN
            v                             v
  +-------------------+         +-------------------+
  |     DISMISSED     |         |   ACTION_TAKEN    |
  |  (False positive) |         | - Post soft-deleted
  +-------------------+         | - User warned/banned
                                +-------------------+
```
