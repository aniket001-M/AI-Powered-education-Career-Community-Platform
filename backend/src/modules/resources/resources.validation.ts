import {
  IsOptional,
  IsString,
  IsNumber,
  IsNotEmpty,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export const VALID_RESOURCE_TYPES = [
  'PDF',
  'VIDEO',
  'ARTICLE',
  'COURSE',
  'PRACTICE',
  'PROJECT',
  'NOTE',
  'SYLLABUS',
  'LAB_MANUAL',
  'QUESTION_PAPER',
] as const;

export class ListResourcesDto {
  @IsOptional()
  @IsString()
  skill?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  @IsIn(VALID_RESOURCE_TYPES)
  type?: (typeof VALID_RESOURCE_TYPES)[number];

  @IsOptional()
  @IsString()
  @IsIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

  @IsOptional()
  @IsString()
  college?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class CreateResourceDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsIn(VALID_RESOURCE_TYPES)
  type!: (typeof VALID_RESOURCE_TYPES)[number];

  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsOptional()
  @IsString()
  storageKey?: string;

  @IsOptional()
  @IsString()
  skillId?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  college?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  @IsIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

export class UpdateResourceDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(VALID_RESOURCE_TYPES)
  type?: (typeof VALID_RESOURCE_TYPES)[number];

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  storageKey?: string;

  @IsOptional()
  @IsString()
  skillId?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  college?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  @IsIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}
