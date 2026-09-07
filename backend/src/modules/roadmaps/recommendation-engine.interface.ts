import mongoose from 'mongoose';

export interface GenerateRoadmapInput {
  userId: string;
  careerId: mongoose.Types.ObjectId;
  targetRole: string;
}

export interface GeneratedStepPlan {
  skillId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  currentProficiency: number;
  targetProficiency: number;
  estimatedHours: number;
  prerequisiteSkillIds: mongoose.Types.ObjectId[];
}

export interface RecommendationEngine {
  generateStepPlan(input: GenerateRoadmapInput): Promise<GeneratedStepPlan[]>;
}
