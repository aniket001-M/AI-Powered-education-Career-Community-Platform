# CareerGraph — Complete Database Schema Reference

The system persists data across 39 MongoDB collections with strict indexing, schema validations, and automated timestamps.

## 1. Identity & Profile Collections
### `users`
- **Fields**: `_id`, `name` (String, required), `email` (String, unique, indexed), `passwordHash` (String, `select: false`), `avatar` (String), `isEmailVerified` (Boolean, default: false), `emailVerificationToken` (String, indexed), `emailVerificationExpires` (Date), `passwordResetToken` (String, indexed), `passwordResetExpires` (Date), `isActive` (Boolean, default: true), `deletedAt` (Date, default: null).
- **Hooks**: Pre-find excludes soft-deleted records (`deletedAt: null`).
- **Indexes**: `{ email: 1 }` (unique), `{ emailVerificationToken: 1 }`, `{ passwordResetToken: 1 }`.

### `roles`
- **Fields**: `_id`, `userId` (Ref: User, required, indexed), `role` (Enum: STUDENT, SENIOR, MENTOR, FACULTY, MODERATOR, ADMIN), `isPrimary` (Boolean), `assignedAt` (Date), `assignedBy` (Ref: User).
- **Indexes**: Compound unique `{ userId: 1, role: 1 }`.

### `refreshsessions`
- **Fields**: `_id`, `userId` (Ref: User, required, indexed), `tokenHash` (String, required, indexed), `userAgent` (String), `ipAddress` (String), `isRevoked` (Boolean, default: false), `expiresAt` (Date, required, indexed).
- **Indexes**: `{ tokenHash: 1 }`, `{ userId: 1, isRevoked: 1 }`, `{ expiresAt: 1 }` (TTL option enabled).

### `studentprofiles`
- **Fields**: `_id`, `userId` (Ref: User, unique), `college` (String), `department` (String), `year` (Number), `semester` (Number), `cgpa` (Number), `bio` (String), `academicInterests` (Array of Strings), `projects` (Array of subdocs), `certifications` (Array of subdocs).
- **Indexes**: `{ userId: 1 }` (unique), `{ department: 1, year: 1 }`.

### `usersettings`
- **Fields**: `_id`, `userId` (Ref: User, unique), `notifications` (email, push, inApp toggles), `theme` (LIGHT, DARK, SYSTEM), `profileVisibility` (PUBLIC, STUDENTS_ONLY, PRIVATE).
- **Indexes**: `{ userId: 1 }` (unique).

---

## 2. Curriculum & Graph Collections
### `careers`
- **Fields**: `_id`, `title` (String, required, indexed), `slug` (String, unique, indexed), `category` (String, indexed), `description` (String), `overview` (String), `salaryRange` (min, max, currency), `demandLevel` (LOW, MEDIUM, HIGH, VERY_HIGH, EMERGING), `growthRate` (String), `isActive` (Boolean), `deletedAt` (Date).
- **Indexes**: `{ slug: 1 }` (unique), `{ category: 1 }`, `{ isActive: 1 }`.

### `skills`
- **Fields**: `_id`, `name` (String, indexed), `slug` (String, unique, indexed), `category` (String, indexed), `description` (String), `parentId` (Ref: Skill, indexed), `level` (FOUNDATIONAL, INTERMEDIATE, ADVANCED), `tags` (Array of Strings), `isActive` (Boolean), `deletedAt` (Date).
- **Indexes**: `{ slug: 1 }` (unique), `{ parentId: 1 }`, `{ category: 1 }`.

### `careerskills`
- **Fields**: `_id`, `careerId` (Ref: Career, indexed), `skillId` (Ref: Skill, indexed), `importance` (MANDATORY, PREFERRED, OPTIONAL), `targetProficiency` (Number 1-5).
- **Indexes**: Compound unique `{ careerId: 1, skillId: 1 }`.

### `skillrelations`
- **Fields**: `_id`, `fromSkillId` (Ref: Skill, indexed), `toSkillId` (Ref: Skill, indexed), `relationType` (PREREQUISITE, RELATED, EXTENSION).
- **Indexes**: Compound unique `{ fromSkillId: 1, toSkillId: 1, relationType: 1 }`.

### `studentskills`
- **Fields**: `_id`, `userId` (Ref: User, indexed), `skillId` (Ref: Skill, indexed), `proficiency` (Number 0-5), `confidence` (Number 0-100), `lastAssessedAt` (Date), `assessmentCount` (Number).
- **Indexes**: Compound unique `{ userId: 1, skillId: 1 }`.

### `studentskillhistories`
- **Fields**: `_id`, `userId` (Ref: User, indexed), `skillId` (Ref: Skill, indexed), `previousProficiency` (Number), `newProficiency` (Number), `reason` (Enum), `assessmentId` (Ref: Assessment).
- **Indexes**: `{ userId: 1, skillId: 1, createdAt: -1 }`.

---

## 3. Assessments & Roadmaps
### `assessments`
- **Fields**: `_id`, `title` (String), `slug` (String, unique), `description` (String), `category` (String), `careerId` (Ref: Career), `skillId` (Ref: Skill), `durationMinutes` (Number), `totalMarks` (Number), `passingScore` (Number), `difficulty` (BEGINNER, INTERMEDIATE, ADVANCED), `isActive` (Boolean).
- **Indexes**: `{ slug: 1 }` (unique), `{ category: 1 }`, `{ careerId: 1 }`.

### `assessmentquestions`
- **Fields**: `_id`, `assessmentId` (Ref: Assessment, indexed), `questionText` (String), `options` (Array of `{ optionId, text }`), `correctOptionId` (String), `explanation` (String), `skillId` (Ref: Skill, indexed), `topic` (String), `difficulty` (EASY, MEDIUM, HARD), `marks` (Number).
- **Indexes**: `{ assessmentId: 1 }`, `{ skillId: 1 }`.

### `assessmentattempts`
- **Fields**: `_id`, `userId` (Ref: User, indexed), `assessmentId` (Ref: Assessment, indexed), `status` (IN_PROGRESS, COMPLETED, ABANDONED, EXPIRED), `startedAt` (Date), `expiresAt` (Date), `submittedAt` (Date).
- **Indexes**: `{ userId: 1, assessmentId: 1 }`, `{ status: 1 }`.

### `assessmentanswers`
- **Fields**: `_id`, `attemptId` (Ref: AssessmentAttempt, indexed), `questionId` (Ref: AssessmentQuestion, indexed), `selectedOptionId` (String), `isCorrect` (Boolean), `marksAwarded` (Number).
- **Indexes**: Compound unique `{ attemptId: 1, questionId: 1 }`.

### `assessmentresults`
- **Fields**: `_id`, `attemptId` (Ref: AssessmentAttempt, unique), `userId` (Ref: User, indexed), `assessmentId` (Ref: Assessment, indexed), `totalScore` (Number), `maxScore` (Number), `percentage` (Number), `passed` (Boolean), `topicPerformance` (Array), `skillPerformance` (Array), `weakAreas` (Array).
- **Indexes**: `{ attemptId: 1 }` (unique), `{ userId: 1, assessmentId: 1 }`.

### `roadmaps`
- **Fields**: `_id`, `userId` (Ref: User, indexed), `careerId` (Ref: Career, indexed), `status` (ACTIVE, ARCHIVED, COMPLETED), `title` (String), `totalSteps` (Number), `completedSteps` (Number), `progressPercentage` (Number).
- **Indexes**: `{ userId: 1, status: 1 }`.

### `roadmapsteps`
- **Fields**: `_id`, `roadmapId` (Ref: Roadmap, indexed), `userId` (Ref: User, indexed), `skillId` (Ref: Skill, indexed), `title` (String), `order` (Number), `stepType` (LEARN, PRACTICE, ASSESS, PROJECT), `status` (NOT_STARTED, IN_PROGRESS, COMPLETED, SKIPPED).
- **Indexes**: `{ roadmapId: 1, order: 1 }`, `{ userId: 1, status: 1 }`.

---

## 4. Learning, Community & Opportunities
### `resources` & `resourceprogresses`
- **Resource Fields**: `_id`, `title`, `slug` (unique), `type` (PDF, VIDEO, NOTE, etc.), `url`, `skillId`, `subject`, `college`, `department`, `difficulty`, `uploadedBy`, `verificationStatus` (PENDING, VERIFIED, REJECTED), `accessCount`, `completionCount`.
- **Progress Fields**: `_id`, `userId` (Ref: User), `resourceId` (Ref: Resource), `status` (ACCESSED, IN_PROGRESS, COMPLETED), `completedAt`.

### `communityposts`, `communitycomments`, `communitylikes`, `communityreports`
- **Post Fields**: `authorId`, `title`, `content`, `category`, `postType`, `tags`, `likesCount`, `commentsCount`, `reportsCount`, `isPinned`, `isDeleted`, `deletedAt`.
- **Report Fields**: `postId`, `reporterId`, `reason`, `details`, `status` (PENDING, REVIEWED, DISMISSED, ACTION_TAKEN).

### `seniorexperiences`
- **Fields**: `authorId`, `company`, `role`, `placementType`, `experienceText`, `tips`, `rounds` (Array), `isVerified` (Boolean), `verifiedBy` (Ref: User), `verifiedAt`.

### `opportunities`, `opportunityskills`, `opportunityrisksignals`, `savedopportunities`
- **Opportunity Fields**: `title`, `company`, `location`, `workplaceType`, `opportunityType`, `stipendOrSalary`, `description`, `applicationUrl`, `deadline`, `isVerified`, `riskScore`, `riskLevel` (LOW, MODERATE, HIGH, CRITICAL).
- **Risk Signal Fields**: `opportunityId`, `reporterId`, `signalType` (UNREALISTIC_SALARY, UPFRONT_PAYMENT, SUSPICIOUS_EMAIL, VAGUE_JD, UNRESPONSIVE, OTHER), `evidence`, `severity`.

### `interviewsessions`, `interviewquestions`, `interviewanswers`, `interviewresults`
- **Session Fields**: `userId`, `careerId`, `roleTitle`, `difficulty` (EASY, MEDIUM, HARD), `status` (IN_PROGRESS, COMPLETED, ABANDONED).
- **Answer Fields**: `sessionId`, `questionId`, `answerText`, `audioUrl`, `evaluations` (clarity, depth, technicalAccuracy), `score`.

### `notifications`
- **Fields**: `userId`, `type` (ROADMAP_STEP_DUE, ASSESSMENT_REMINDER, COMMUNITY_REPLY, SENIOR_VERIFIED, OPPORTUNITY_DEADLINE, SYSTEM), `title`, `message`, `data`, `readAt`.

### `files`
- **Fields**: `uploadedBy`, `fileName`, `storageKey`, `mimeType`, `sizeBytes`, `category` (AVATAR, RESUME, PROJECT_ASSET, RESOURCE_ATTACHMENT), `accessLevel` (PUBLIC, PRIVATE).

### `auditlogs`
- **Fields**: `actorId`, `actorEmail`, `actorRole`, `action`, `resourceType`, `resourceId`, `details`, `ipAddress`, `userAgent`, `status` (SUCCESS, FAILED).
