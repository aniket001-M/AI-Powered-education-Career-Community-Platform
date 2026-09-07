export type Role = "student" | "admin" | "faculty" | "senior";

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

export interface Skill {
  id: string;
  name: string;
  category: "engineering" | "data" | "product" | "design" | "systems";
  level: SkillLevel;
  proficiency: number; // 0-100
  demandIndex: number; // 0-100
  verified: boolean;
  lastAssessed: string;
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  summary: string;
  term: string;
  status: "completed" | "in-progress" | "upcoming" | "blocked";
  weeks: number;
  outcomes: string[];
}

export interface JobRole {
  id: string;
  title: string;
  company: string;
  location: string;
  mode: "onsite" | "hybrid" | "remote";
  type: "internship" | "full-time";
  salaryRange: string;
  postedAt: string;
  matchScore: number;
  skills: string[];
  description: string;
}

export type ApplicationStage =
  | "draft"
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "rejected";

export interface Application {
  id: string;
  jobId: string;
  role: string;
  company: string;
  stage: ApplicationStage;
  updatedAt: string;
  nextStep: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  batch: string;
  department: string;
  cgpa: number;
  headline: string;
  location: string;
  readiness: number;
  mentor: string;
}

export interface StudentRecord {
  id: string;
  name: string;
  department: string;
  batch: string;
  readiness: number;
  applications: number;
  status: "active" | "placed" | "at-risk";
}

export interface Mentee {
  id: string;
  name: string;
  batch: string;
  focus: string;
  readiness: number;
  lastMeeting: string;
  flag: "on-track" | "needs-review" | "critical";
}

export interface Referral {
  id: string;
  student: string;
  role: string;
  company: string;
  submittedAt: string;
  status: "pending" | "forwarded" | "interviewing" | "closed";
}

export interface AlumniStory {
  id: string;
  name: string;
  batch: string;
  role: string;
  company: string;
  quote: string;
  path: string[];
}

export interface Metric {
  id: string;
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "flat";
  hint: string;
}

export interface TrendPoint {
  period: string;
  placements: number;
  readiness: number;
}
