# CareerGraph — Complete API Route Catalog

All routes are mounted under the prefix `/api/v1`.

## 1. Authentication (`/api/v1/auth`)
| Route | Method | Auth | Role | DTO | Response Codes | Description |
|---|---|---|---|---|---|---|
| `/auth/register` | POST | None | Public | `RegisterDto` | 201, 400, 409, 422 | Register user, assign role, create student profile |
| `/auth/login` | POST | None | Public | `LoginDto` | 200, 401, 422 | Login with email & password, create refresh session |
| `/auth/refresh` | POST | None | Public | `RefreshTokenDto` | 200, 401 | Refresh token rotation with reuse revocation |
| `/auth/me` | GET | Bearer | Any | None | 200, 401 | Retrieve currently authenticated user context |
| `/auth/logout` | POST | Bearer | Any | `LogoutDto` | 200, 401 | Invalidate session in Redis & DB |
| `/auth/verify-email` | POST | None | Public | `VerifyEmailDto` | 200, 400 | Verify email via signed token |
| `/auth/resend-verification` | POST | Bearer | Any | None | 200, 429 | Resend verification email |
| `/auth/forgot-password` | POST | None | Public | `ForgotPasswordDto` | 200, 429 | Request password reset token |
| `/auth/reset-password` | POST | None | Public | `ResetPasswordDto` | 200, 400, 422 | Reset password via token |

---

## 2. Students & Profile (`/api/v1/students` & `/api/v1/users`)
| Route | Method | Auth | Role | DTO | Response Codes | Description |
|---|---|---|---|---|---|---|
| `/users/me` | GET | Bearer | Any | None | 200, 401 | Get self user account |
| `/users/me` | PATCH | Bearer | Any | `UpdateUserDto` | 200, 401, 422 | Update self name / basic info |
| `/students/me/profile` | GET | Bearer | STUDENT | None | 200, 403 | Aggregated student profile with academics & skills |
| `/students/me/academic` | GET | Bearer | STUDENT | None | 200, 403 | Get student academic profile (CGPA, college) |
| `/students/me/academic` | PATCH | Bearer | STUDENT | `UpdateAcademicProfileDto` | 200, 422 | Update academic record |
| `/students/me/career-goals` | PATCH | Bearer | STUDENT | `UpdateCareerGoalsDto` | 200, 422 | Update target careers & industries |
| `/students/me/projects` | POST | Bearer | STUDENT | `AddProjectDto` | 201, 422 | Add project to student portfolio |
| `/students/me/projects/:id` | DELETE | Bearer | STUDENT | None | 200, 404 | Remove project from student portfolio |
| `/students/me/dashboard` | GET | Bearer | STUDENT | None | 200, 403 | Aggregated student metrics dashboard |

---

## 3. Careers & Skills (`/api/v1/careers` & `/api/v1/skills`)
| Route | Method | Auth | Role | DTO | Response Codes | Description |
|---|---|---|---|---|---|---|
| `/careers` | GET | None | Public | `QueryCareersDto` | 200 | List careers with pagination & filters |
| `/careers/:careerId` | GET | None | Public | None | 200, 404 | Get career detail by slug or ID |
| `/careers/:careerId/skills` | GET | None | Public | None | 200, 404 | Get required skills for career |
| `/careers/:careerId/skill-graph` | GET | None | Public | None | 200, 404 | Graph nodes and edges for career pathway |
| `/students/me/career-goal` | POST | Bearer | STUDENT | `SetCareerGoalDto` | 200, 404 | Select active career target |
| `/students/me/career-goal` | GET | Bearer | STUDENT | None | 200, 404 | Retrieve active target career goal |
| `/students/me/career-goal` | DELETE | Bearer | STUDENT | None | 200 | Clear target career goal |
| `/skills` | GET | None | Public | `QuerySkillsDto` | 200 | List active skills taxonomy |
| `/skills/:skillId` | GET | None | Public | None | 200, 404 | Get skill by ID or slug |
| `/skills/:skillId/children` | GET | None | Public | None | 200, 404 | Get direct child sub-skills |
| `/skills/graph` | GET | None | Public | None | 200 | Global skill ontology graph |
| `/students/me/skills` | GET | Bearer | STUDENT | None | 200 | List student current skill proficiencies |
| `/students/me/skills/:skillId` | PUT | Bearer | STUDENT | `UpdateSkillProficiencyDto` | 200, 422 | Self-rate or update proficiency |
| `/students/me/skills/:skillId/history` | GET | Bearer | STUDENT | None | 200, 404 | Historical proficiency evolution |
| `/students/me/skill-gaps` | GET | Bearer | STUDENT | None | 200, 400 | Gap analysis between student and goal |

---

## 4. Assessments (`/api/v1/assessments` & `/api/v1/assessment-attempts`)
| Route | Method | Auth | Role | DTO | Response Codes | Description |
|---|---|---|---|---|---|---|
| `/assessments` | GET | None | Public | `QueryAssessmentsDto` | 200 | List assessments with difficulty/category filters |
| `/assessments/:id` | GET | None | Public | None | 200, 404 | Assessment specifications |
| `/assessments/:id/questions` | GET | Bearer | STUDENT | None | 200, 404 | Questions without answers/explanations |
| `/assessments/:id/start` | POST | Bearer | STUDENT | None | 201, 400 | Initialize new assessment attempt session |
| `/assessment-attempts/:id/answer` | POST | Bearer | STUDENT | `SubmitAnswerDto` | 200, 400, 422 | Submit answer for question in attempt |
| `/assessment-attempts/:id/submit` | POST | Bearer | STUDENT | None | 200, 400 | Finalize attempt, calculate score & update skills |
| `/assessment-attempts/:id/result` | GET | Bearer | STUDENT | None | 200, 403, 404 | Full scorecard and topic breakdown |
| `/students/me/assessments` | GET | Bearer | STUDENT | None | 200 | Student attempt history |

---

## 5. Roadmaps (`/api/v1/roadmap-steps` & `/api/v1/students/me/roadmap`)
| Route | Method | Auth | Role | DTO | Response Codes | Description |
|---|---|---|---|---|---|---|
| `/students/me/roadmap` | GET | Bearer | STUDENT | None | 200, 404 | Get student active personalized roadmap |
| `/students/me/roadmap/generate` | POST | Bearer | STUDENT | None | 201, 400 | Generate roadmap based on career goal & skill gaps |
| `/students/me/roadmap/recalculate` | POST | Bearer | STUDENT | None | 200, 400 | Recalculate roadmap steps based on updated skills |
| `/roadmap-steps/:stepId/status` | PATCH | Bearer | STUDENT | `UpdateStepStatusDto` | 200, 403, 422 | Update step progress (IN_PROGRESS, COMPLETED) |

---

## 6. Learning Resources & AI/RAG (`/api/v1/resources`)
| Route | Method | Auth | Role | DTO | Response Codes | Description |
|---|---|---|---|---|---|---|
| `/resources` | GET | None | Public | `QueryResourcesDto` | 200 | List resources by type, skill, department |
| `/resources` | POST | Bearer | Any | `CreateResourceDto` | 201, 422 | Upload resource metadata |
| `/resources/:id` | GET | None | Public | None | 200, 404 | Get resource metadata & link |
| `/resources/:id` | PATCH | Bearer | Author/Mod | `UpdateResourceDto` | 200, 403, 422 | Update resource details |
| `/resources/:id` | DELETE | Bearer | Author/Mod | None | 200, 403 | Soft delete resource |
| `/resources/:id/access` | POST | Bearer | Any | None | 200 | Track resource engagement count |
| `/resources/:id/complete` | POST | Bearer | Any | None | 200 | Mark resource completed by student |
| `/resources/knowledge/search` | POST | Bearer | Any | `KnowledgeSearchDto` | 501 | Controlled AI Knowledge semantic search stub |
| `/resources/knowledge/ask` | POST | Bearer | Any | `KnowledgeAskDto` | 501 | Controlled RAG question answering stub |

---

## 7. Job Analyzer (`/api/v1/job-analyses` & `/api/v1/students/me/job-analyses`)
| Route | Method | Auth | Role | DTO | Response Codes | Description |
|---|---|---|---|---|---|---|
| `/job-analyses` | POST | Bearer | STUDENT | `CreateJobAnalysisDto` | 201, 422 | Create JD analysis record |
| `/job-analyses/:id` | GET | Bearer | STUDENT | None | 200, 403, 404 | Get job analysis report |
| `/job-analyses/:id/analyze` | POST | Bearer | STUDENT | None | 200, 403 | Deterministic keyword skill extraction |
| `/job-analyses/:id/add-to-roadmap` | POST | Bearer | STUDENT | None | 200, 403 | Append missing JD skills to roadmap |
| `/job-analyses/semantic/match` | POST | Bearer | STUDENT | `SemanticMatchDto` | 501 | Controlled Semantic Matching AI stub |
| `/students/me/job-analyses` | GET | Bearer | STUDENT | None | 200 | List user job analyses history |

---

## 8. Community (`/api/v1/community`)
| Route | Method | Auth | Role | DTO | Response Codes | Description |
|---|---|---|---|---|---|---|
| `/community/posts` | GET | None | Public | `QueryPostsDto` | 200 | Paginated forum feed with category filter |
| `/community/posts` | POST | Bearer | Any | `CreatePostDto` | 201, 422 | Create community discussion post |
| `/community/posts/:id` | GET | None | Public | None | 200, 404 | Post detail with comment thread |
| `/community/posts/:id` | PATCH | Bearer | Author/Mod | `UpdatePostDto` | 200, 403, 422 | Edit post content |
| `/community/posts/:id` | DELETE | Bearer | Author/Mod | None | 200, 403 | Soft delete post |
| `/community/posts/:id/comments`| POST | Bearer | Any | `CreateCommentDto` | 201, 422 | Add comment or reply |
| `/community/posts/:id/like` | POST | Bearer | Any | None | 200 | Toggle like on post |
| `/community/posts/:id/report` | POST | Bearer | Any | `ReportPostDto` | 201, 409, 422 | Flag post for moderation queue |
| `/community/posts/:id/similar` | GET | None | Public | None | 200 | Tag-based similar post discovery |

---

## 9. Senior Experiences & Opportunities (`/api/v1/senior-experiences` & `/api/v1/opportunities`)
| Route | Method | Auth | Role | DTO | Response Codes | Description |
|---|---|---|---|---|---|---|
| `/senior-experiences` | GET | None | Public | `QueryExperiencesDto`| 200 | List senior interview and placement experiences |
| `/senior-experiences` | POST | Bearer | SENIOR/MENTOR | `CreateExperienceDto` | 201, 422 | Submit placement experience |
| `/senior-experiences/:id` | GET | None | Public | None | 200, 404 | Detail of senior experience |
| `/senior-experiences/:id/verify`| PATCH | Bearer | Faculty/Admin | None | 200, 403 | Institutional verification of experience |
| `/opportunities` | GET | None | Public | `QueryOpportunitiesDto`| 200 | List active jobs & internships |
| `/opportunities` | POST | Bearer | Any | `CreateOpportunityDto` | 201, 422 | Post an opportunity listing |
| `/opportunities/:id` | GET | None | Public | None | 200, 404 | Detail of opportunity with risk indicators |
| `/opportunities/:id/verify` | PATCH | Bearer | Faculty/Admin | None | 200, 403 | Verify opportunity listing authenticity |
| `/opportunities/:id/risk-signals`| POST| Bearer | Any | `RiskSignalDto` | 201, 422 | Report suspicious signals (no auto-fraud) |
| `/opportunities/:id/save` | POST | Bearer | STUDENT | None | 200 | Bookmark opportunity |
| `/students/me/saved-opportunities`| GET| Bearer | STUDENT | None | 200 | List student saved opportunities |

---

## 10. Interviews, Notifications, Settings, Files (`/api/v1/...`)
| Route | Method | Auth | Role | DTO | Response Codes | Description |
|---|---|---|---|---|---|---|
| `/interviews` | POST | Bearer | STUDENT | `CreateInterviewSessionDto` | 201, 422 | Start mock interview session |
| `/interviews/:id` | GET | Bearer | STUDENT | None | 200, 403, 404 | Get interview session status |
| `/interviews/:id/questions` | GET | Bearer | STUDENT | None | 200, 403 | Get questions assigned to interview |
| `/interviews/:id/answers` | POST | Bearer | STUDENT | `SubmitInterviewAnswerDto` | 200, 403, 422 | Submit answer for rubric evaluation |
| `/interviews/:id/complete` | POST | Bearer | STUDENT | None | 200, 403 | Finalize interview and generate score |
| `/interviews/:id/result` | GET | Bearer | STUDENT | None | 200, 403, 404 | Detailed strengths and weakness report |
| `/students/me/interviews` | GET | Bearer | STUDENT | None | 200 | Student mock interview history |
| `/notifications` | GET | Bearer | Any | `QueryNotificationsDto` | 200 | User notifications list |
| `/notifications/unread-count` | GET | Bearer | Any | None | 200 | Fast unread notification counter |
| `/notifications/:id/read` | PATCH | Bearer | Any | None | 200, 403, 404 | Mark specific notification as read |
| `/notifications/read-all` | PATCH | Bearer | Any | None | 200 | Mark all notifications read |
| `/settings` | GET | Bearer | Any | None | 200 | Get user settings and preferences |
| `/settings` | PATCH | Bearer | Any | `UpdateSettingsDto` | 200, 422 | Update theme, notifications, visibility |
| `/settings/change-password` | POST | Bearer | Any | `ChangePasswordDto` | 200, 400, 422 | Change password and revoke sessions |
| `/settings/account` | DELETE | Bearer | Any | `DeleteAccountDto` | 200, 400, 422 | Deactivate account and soft-delete |
| `/files/upload-url` | POST | Bearer | Any | `UploadUrlDto` | 200, 422 | Generate secure S3 pre-signed upload URL |
| `/files/confirm` | POST | Bearer | Any | `ConfirmUploadDto` | 201, 422 | Confirm upload and save file metadata |
| `/files/:fileId` | GET | Bearer | Any | None | 200, 403, 404 | Get file metadata & signed download URL |

---

## 11. Admin, Faculty & Audit (`/api/v1/...`)
| Route | Method | Auth | Role | DTO | Response Codes | Description |
|---|---|---|---|---|---|---|
| `/admin/dashboard` | GET | Bearer | ADMIN | None | 200, 403 | High-level system & user aggregate metrics |
| `/admin/users` | GET | Bearer | ADMIN | `QueryUsersDto` | 200, 403 | Paginated user management directory |
| `/admin/users/:id` | PATCH | Bearer | ADMIN | `UpdateUserDto` | 200, 403, 422 | Update user role and active status |
| `/admin/reports` | GET | Bearer | ADMIN/MOD | `QueryReportsDto` | 200, 403 | Moderation reports review queue |
| `/admin/reports/:id` | PATCH | Bearer | ADMIN/MOD | `ResolveReportDto` | 200, 403, 422 | Resolve report and trigger actions |
| `/admin/careers` | POST | Bearer | ADMIN | `CreateCareerDto` | 201, 403, 422 | Add new career pathway |
| `/admin/careers/:id` | PATCH | Bearer | ADMIN | `UpdateCareerDto` | 200, 403, 422 | Update career pathway |
| `/admin/skills` | POST | Bearer | ADMIN | `CreateSkillDto` | 201, 403, 422 | Add new skill to graph |
| `/admin/skills/:id` | PATCH | Bearer | ADMIN | `UpdateSkillDto` | 200, 403, 422 | Update skill in graph |
| `/admin/audit-logs` | GET | Bearer | ADMIN | `QueryAuditLogsDto` | 200, 403 | Query system administrative audit log |
| `/faculty/dashboard` | GET | Bearer | FACULTY/ADMIN | None | 200, 403 | Departmental learning & assessment stats |
| `/faculty/assessments` | POST | Bearer | FACULTY/ADMIN | `CreateFacultyAssessmentDto` | 201, 403, 422 | Author curriculum assessment |
| `/faculty/resources` | POST | Bearer | FACULTY/ADMIN | `CreateFacultyResourceDto` | 201, 403, 422 | Upload verified academic material |
| `/faculty/analytics` | GET | Bearer | FACULTY/ADMIN | `FacultyAnalyticsQueryDto` | 200, 403 | Cohort-level performance & skill gaps |
| `/audit-logs` | GET | Bearer | ADMIN | `QueryAuditLogsDto` | 200, 403 | List security and mutation audit records |
| `/audit-logs/:logId` | GET | Bearer | ADMIN | None | 200, 403, 404 | Deep-dive single audit record |
