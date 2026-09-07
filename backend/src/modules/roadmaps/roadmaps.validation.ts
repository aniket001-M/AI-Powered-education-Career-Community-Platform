import { IsOptional, IsString, IsIn } from 'class-validator';

export class GenerateRoadmapDto {
  @IsOptional()
  @IsString()
  careerId?: string;

  @IsOptional()
  @IsString()
  targetRole?: string;
}

export class UpdateStepStatusDto {
  @IsString()
  @IsIn(['LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'])
  status!: 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
}
