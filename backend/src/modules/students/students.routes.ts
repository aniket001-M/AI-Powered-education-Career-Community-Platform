import { Router } from 'express';
import * as controller from './students.controller';
import { validateRequest } from '@/common/middleware/validate';
import { authenticate } from '@/common/middleware/authenticate';
import { authorize } from '@/common/middleware/authorize';
import { UserRole } from '@/common/enums/roles.enum';
import {
  UpdateAcademicProfileDto,
  UpdateCareerGoalsDto,
  CreateProjectDto,
} from './students.validation';
import {
  selectStudentCareer,
  getStudentCareerGoals,
  removeStudentCareerGoal,
} from '@/modules/careers/careers.controller';
import { SelectCareerGoalDto } from '@/modules/careers/careers.validation';
import {
  getStudentSkills,
  updateStudentSkill,
  getStudentSkillHistory,
  getStudentSkillGaps,
} from '@/modules/skills/skills.controller';
import { UpdateStudentSkillDto } from '@/modules/skills/skills.validation';
import {
  getStudentAssessments,
  getStudentWeakAreas,
} from '@/modules/assessments/assessments.controller';
import {
  getCurrentRoadmap,
  generateRoadmap,
  getRoadmapHistory,
  recalculateRoadmap,
} from '@/modules/roadmaps/roadmaps.controller';
import { GenerateRoadmapDto } from '@/modules/roadmaps/roadmaps.validation';
import { getStudentHistory as getStudentResourceHistory } from '@/modules/resources/resources.controller';
import { getStudentJobAnalyses } from '@/modules/jobs/jobs.controller';
import { getStudentSavedOpportunities } from '@/modules/opportunities/opportunities.controller';
import { getStudentInterviewHistory } from '@/modules/interviews/interviews.controller';

const router = Router();

// All student routes require authentication and STUDENT role
router.use(authenticate, authorize(UserRole.STUDENT));

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: Student profile, academics, career goals, projects, and dashboard
 */

/**
 * @swagger
 * /students/me/academic:
 *   get:
 *     summary: Get student academic profile (USER-03)
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Student academic profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 *   patch:
 *     summary: Update student academic profile (USER-04)
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               college:
 *                 type: string
 *                 example: IIT Bombay
 *               department:
 *                 type: string
 *                 example: Computer Science & Engineering
 *               year:
 *                 type: integer
 *                 example: 3
 *               semester:
 *                 type: integer
 *                 example: 5
 *               cgpa:
 *                 type: number
 *                 example: 8.75
 *               academicInterests:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Distributed Systems", "Cloud Computing"]
 *     responses:
 *       200:
 *         description: Academic profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 */
router.get('/me/academic', controller.getAcademic);
router.patch('/me/academic', validateRequest(UpdateAcademicProfileDto), controller.updateAcademic);

/**
 * @swagger
 * /students/me/profile:
 *   get:
 *     summary: Get full aggregated student profile (USER-05)
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregated student profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 */
router.get('/me/profile', controller.getProfile);

/**
 * @swagger
 * /students/me/career-goals:
 *   patch:
 *     summary: Update student career goals (USER-06)
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Backend Developer
 *               isPrimary:
 *                 type: boolean
 *                 example: true
 *               targetRole:
 *                 type: string
 *                 example: Junior Backend Engineer
 *               timeline:
 *                 type: string
 *                 example: 6 months
 *               preferredLocations:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Bangalore", "Remote"]
 *     responses:
 *       200:
 *         description: Career goals updated successfully
 */
router.patch('/me/career-goals', validateRequest(UpdateCareerGoalsDto), controller.updateCareerGoals);
router.post('/me/career-goals', validateRequest(SelectCareerGoalDto), selectStudentCareer);
router.get('/me/career-goals', getStudentCareerGoals);
router.delete('/me/career-goals/:careerGoalId', removeStudentCareerGoal);

/**
 * @swagger
 * /students/me/projects:
 *   post:
 *     summary: Add project to student portfolio (USER-07)
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Microservices E-Commerce
 *               description:
 *                 type: string
 *                 example: Built a scalable event-driven e-commerce backend
 *               technologies:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Node.js", "Express", "Docker", "MongoDB"]
 *               githubUrl:
 *                 type: string
 *                 example: https://github.com/rahul/ecommerce
 *               liveUrl:
 *                 type: string
 *                 example: https://demo.example.com
 *     responses:
 *       201:
 *         description: Project added successfully
 */
router.post('/me/projects', validateRequest(CreateProjectDto), controller.addProject);

/**
 * @swagger
 * /students/me/projects/{projectId}:
 *   delete:
 *     summary: Delete project from student portfolio (USER-08)
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       404:
 *         description: Project not found
 */
router.delete('/me/projects/:projectId', controller.deleteProject);

/**
 * @swagger
 * /students/me/dashboard:
 *   get:
 *     summary: Get student aggregated dashboard
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Student dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 */
router.get('/me/dashboard', controller.getDashboard);

/**
 * @swagger
 * /students/me/skills:
 *   get:
 *     summary: Get student acquired skills & proficiencies (SKILL-05)
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of student skills
 */
router.get('/me/skills', getStudentSkills);

/**
 * @swagger
 * /students/me/skills/{skillId}:
 *   patch:
 *     summary: Update student skill proficiency and confidence (SKILL-06)
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: skillId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [proficiency]
 *             properties:
 *               proficiency:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 5
 *                 example: 3
 *               confidence:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 75
 *               reason:
 *                 type: string
 *                 example: Completed coursework and mini-project
 *     responses:
 *       200:
 *         description: Skill updated successfully
 */
router.patch(
  '/me/skills/:skillId',
  validateRequest(UpdateStudentSkillDto),
  updateStudentSkill,
);

/**
 * @swagger
 * /students/me/skills/{skillId}/history:
 *   get:
 *     summary: Get student skill proficiency progression history (SKILL-07)
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: skillId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Skill progression history
 */
router.get('/me/skills/:skillId/history', getStudentSkillHistory);

/**
 * @swagger
 * /students/me/skill-gaps:
 *   get:
 *     summary: Get skill gaps against target career requirements (SKILL-08)
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: career
 *         schema:
 *           type: string
 *         description: Optional target career ID or slug to evaluate against
 *     responses:
 *       200:
 *         description: Deterministic skill gap analysis with match score
 */
router.get('/me/skill-gaps', getStudentSkillGaps);

/**
 * @swagger
 * /students/me/assessments:
 *   get:
 *     summary: Get student assessment attempt history and scores (ASSESS-09)
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of completed student assessments
 */
router.get('/me/assessments', getStudentAssessments);

/**
 * @swagger
 * /students/me/assessment-weak-areas:
 *   get:
 *     summary: Get aggregated weak skill areas from completed assessments (ASSESS-10)
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregated weak areas across assessments
 */
router.get('/me/assessment-weak-areas', getStudentWeakAreas);

/**
 * @swagger
 * /students/me/roadmap:
 *   get:
 *     summary: Get student current active learning roadmap (ROADMAP-01)
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Active roadmap with ordered steps
 */
router.get('/me/roadmap', getCurrentRoadmap);

/**
 * @swagger
 * /students/me/roadmap/generate:
 *   post:
 *     summary: Generate or rebuild learning roadmap based on career requirements and skill gaps (ROADMAP-02)
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               careerId:
 *                 type: string
 *               targetRole:
 *                 type: string
 *     responses:
 *       201:
 *         description: New roadmap generated
 */
router.post(
  '/me/roadmap/generate',
  validateRequest(GenerateRoadmapDto),
  generateRoadmap,
);

/**
 * @swagger
 * /students/me/roadmap/history:
 *   get:
 *     summary: Get student roadmap version history (ROADMAP-06)
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of historical and active roadmaps
 */
router.get('/me/roadmap/history', getRoadmapHistory);

/**
 * @swagger
 * /students/me/roadmap/recalculate:
 *   post:
 *     summary: Recalculate roadmap progress and auto-unlock steps based on updated student skill states (ROADMAP-07)
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Recalculated roadmap
 */
router.post('/me/roadmap/recalculate', recalculateRoadmap);

/**
 * @swagger
 * /students/me/resources/history:
 *   get:
 *     summary: Get student learning resource access and completion history (RESOURCE-08)
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Student learning resource progress history
 */
router.get('/me/resources/history', getStudentResourceHistory);

/**
 * @swagger
 * /students/me/job-analyses:
 *   get:
 *     summary: List job analyses performed by current student (JOB-03)
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of student's job analyses
 */
router.get('/me/job-analyses', getStudentJobAnalyses);

/**
 * @swagger
 * /students/me/saved-opportunities:
 *   get:
 *     summary: Get student saved opportunities (OPPORTUNITY-08)
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of saved opportunities
 */
router.get('/me/saved-opportunities', getStudentSavedOpportunities);

/**
 * @swagger
 * /students/me/interviews:
 *   get:
 *     summary: Get student mock interview session history (INTERVIEW-07)
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of past interview sessions
 */
router.get('/me/interviews', getStudentInterviewHistory);

export { router as studentsRouter };
