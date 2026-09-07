import { Router } from 'express';
import { authRouter } from '@/modules/auth/auth.routes';

import { usersRouter } from '@/modules/users/users.routes';
import { studentsRouter } from '@/modules/students/students.routes';
import { careersRouter } from '@/modules/careers/careers.routes';
import { skillsRouter } from '@/modules/skills/skills.routes';
import { assessmentsRouter } from '@/modules/assessments/assessments.routes';
import { assessmentAttemptsRouter } from '@/modules/assessments/attempts.routes';
import { roadmapStepsRouter } from '@/modules/roadmaps/steps.routes';
import { resourcesRouter } from '@/modules/resources/resources.routes';
import { jobAnalysesRouter } from '@/modules/jobs/jobs.routes';
import { communityRouter } from '@/modules/community/community.routes';
import { seniorsRouter } from '@/modules/seniors/seniors.routes';
import { opportunitiesRouter } from '@/modules/opportunities/opportunities.routes';
import { interviewsRouter } from '@/modules/interviews/interviews.routes';
import { notificationsRouter } from '@/modules/notifications/notifications.routes';
import { settingsRouter } from '@/modules/settings/settings.routes';
import { filesRouter } from '@/modules/files/files.routes';
import adminRouter from '@/modules/admin/admin.routes';
import facultyRouter from '@/modules/faculty/faculty.routes';
import auditRouter from '@/modules/audit/audit.routes';

const router = Router();

// Mount module routers under /api/v1
router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/students', studentsRouter);
router.use('/careers', careersRouter);
router.use('/skills', skillsRouter);
router.use('/assessments', assessmentsRouter);
router.use('/assessment-attempts', assessmentAttemptsRouter);
router.use('/roadmap-steps', roadmapStepsRouter);
router.use('/resources', resourcesRouter);
router.use('/job-analyses', jobAnalysesRouter);
router.use('/community', communityRouter);
router.use('/senior-experiences', seniorsRouter);
router.use('/opportunities', opportunitiesRouter);
router.use('/interviews', interviewsRouter);
router.use('/notifications', notificationsRouter);
router.use('/settings', settingsRouter);
router.use('/files', filesRouter);
router.use('/admin', adminRouter);
router.use('/faculty', facultyRouter);
router.use('/audit-logs', auditRouter);

export default router;
