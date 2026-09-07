import * as db from "./mock-data";
import type {
  AlumniStory,
  Application,
  JobRole,
  Mentee,
  Metric,
  Referral,
  RoadmapMilestone,
  Skill,
  StudentProfile,
  StudentRecord,
  TrendPoint,
} from "./types";

/**
 * Mock service layer. Every function simulates network latency so the UI can
 * exercise loading, empty and error states. No backend is involved.
 */

const LATENCY = 550;

function resolve<T>(value: T, latency = LATENCY): Promise<T> {
  return new Promise((r) => setTimeout(() => r(structuredClone(value)), latency));
}

function reject(message: string, latency = LATENCY): Promise<never> {
  return new Promise((_, r) => setTimeout(() => r(new Error(message)), latency));
}

export const getStudentProfile = (): Promise<StudentProfile> => resolve(db.studentProfile);
export const getSkills = (): Promise<Skill[]> => resolve(db.skills);
export const getRoadmap = (): Promise<RoadmapMilestone[]> => resolve(db.roadmap);
export const getJobs = (): Promise<JobRole[]> => resolve(db.jobs);
export const getApplications = (): Promise<Application[]> => resolve(db.applications);
export const getStudentRecords = (): Promise<StudentRecord[]> => resolve(db.studentRecords);
export const getMentees = (): Promise<Mentee[]> => resolve(db.mentees);
export const getReferrals = (): Promise<Referral[]> => resolve(db.referrals);
export const getAlumniStories = (): Promise<AlumniStory[]> => resolve(db.alumniStories);
export const getTrend = (): Promise<TrendPoint[]> => resolve(db.trend);

export const getMetrics = (role: "admin" | "faculty" | "senior"): Promise<Metric[]> =>
  resolve(
    role === "admin" ? db.adminMetrics : role === "faculty" ? db.facultyMetrics : db.seniorMetrics,
  );

/** Deliberately failing endpoint used to demonstrate the error state. */
export const getFlakyFeed = (shouldFail: boolean): Promise<string[]> =>
  shouldFail
    ? reject("The intelligence feed could not be reached.")
    : resolve([
        "Systems depth track review scheduled with Dr. Iyer.",
        "Northwind Systems moved your application to the interview stage.",
        "Three new roles match above 80% of your current graph.",
      ]);

export interface SubmitResult {
  ok: boolean;
  message: string;
}

export const submitEnquiry = (payload: {
  name: string;
  email: string;
  message: string;
}): Promise<SubmitResult> =>
  payload.email.endsWith("@example.com")
    ? resolve({ ok: false, message: "Placeholder addresses are not accepted." }, 800)
    : resolve({ ok: true, message: "Enquiry recorded. The team responds within two days." }, 900);

export const saveProfile = (profile: StudentProfile): Promise<SubmitResult> =>
  resolve({ ok: true, message: `Profile for ${profile.name} saved locally.` }, 800);
