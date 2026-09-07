import { AppError } from '@/common/errors/AppError';
import { ErrorCode } from '@/common/errors/error-codes';

export interface SemanticMatchResult {
  matchScore: number;
  matchedSkills: Array<{
    name: string;
    similarity: number;
  }>;
  explanation: string;
}

export interface SemanticMatchingEngine {
  extractSkills(jobDescription: string): Promise<string[]>;
  computeSemanticMatch(
    jobSkills: string[],
    studentSkills: Array<{ skillName: string; proficiency: number }>,
  ): Promise<SemanticMatchResult>;
}

/**
 * Controlled implementation returning AI_NOT_ENABLED per FRD specifications.
 * Never fabricates ML/semantic embeddings matching scores.
 */
export class UnimplementedSemanticMatchingEngine implements SemanticMatchingEngine {
  async extractSkills(_jobDescription: string): Promise<string[]> {
    throw new AppError(
      501,
      ErrorCode.AI_NOT_ENABLED,
      'Semantic AI skill extraction service is not enabled in this deployment.',
    );
  }

  async computeSemanticMatch(
    _jobSkills: string[],
    _studentSkills: Array<{ skillName: string; proficiency: number }>,
  ): Promise<SemanticMatchResult> {
    throw new AppError(
      501,
      ErrorCode.AI_NOT_ENABLED,
      'Semantic AI matching service is not enabled in this deployment.',
    );
  }
}

export const semanticMatchingEngine: SemanticMatchingEngine =
  new UnimplementedSemanticMatchingEngine();
