import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsIn,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class QuestionOptionDto {
  @IsString()
  optionId!: string;

  @IsString()
  text!: string;
}

export class FacultyAssessmentQuestionDto {
  @IsString()
  questionText!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options!: QuestionOptionDto[];

  @IsString()
  correctOptionId!: string;

  @IsString()
  skillId!: string;

  @IsString()
  topic!: string;

  @IsOptional()
  @IsIn(['EASY', 'MEDIUM', 'HARD'])
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';

  @IsOptional()
  @IsNumber()
  @Min(1)
  marks?: number;

  @IsOptional()
  @IsString()
  explanation?: string;
}

export class CreateFacultyAssessmentDto {
  @IsString()
  title!: string;

  @IsString()
  category!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  careerId?: string;

  @IsOptional()
  @IsString()
  skillId?: string;

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(180)
  durationMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  totalMarks?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  passingScore?: number;

  @IsOptional()
  @IsIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FacultyAssessmentQuestionDto)
  questions?: FacultyAssessmentQuestionDto[];
}

export class CreateFacultyResourceDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsIn([
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
  ])
  type!:
    | 'PDF'
    | 'VIDEO'
    | 'ARTICLE'
    | 'COURSE'
    | 'PRACTICE'
    | 'PROJECT'
    | 'NOTE'
    | 'SYLLABUS'
    | 'LAB_MANUAL'
    | 'QUESTION_PAPER';

  @IsString()
  url!: string;

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
  @IsIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

export class FacultyAnalyticsQueryDto {
  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  careerId?: string;
}
