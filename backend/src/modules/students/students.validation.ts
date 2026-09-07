import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  Min,
  Max,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── USER-04 Update Academic Profile ────────────────────────
export class UpdateAcademicProfileDto {
  @IsOptional()
  @IsString()
  college?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(6)
  year?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  semester?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  cgpa?: number;

  @IsOptional()
  @IsNumber()
  @Min(2000)
  @Max(2100)
  expectedGraduationYear?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  academicInterests?: string[];
}

// ─── Career Goal Item DTO ───────────────────────────────────
export class CareerGoalItemDto {
  @IsOptional()
  @IsString()
  careerId?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsString()
  targetRole?: string;

  @IsOptional()
  @IsString()
  timeline?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredLocations?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

// ─── USER-06 Update Career Goals ────────────────────────────
export class UpdateCareerGoalsDto {
  @IsOptional()
  @IsString()
  careerId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsString()
  targetRole?: string;

  @IsOptional()
  @IsString()
  timeline?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredLocations?: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CareerGoalItemDto)
  careerGoals?: CareerGoalItemDto[];
}

// ─── USER-07 Add Project ────────────────────────────────────
export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];

  @IsOptional()
  @IsString()
  githubUrl?: string;

  @IsOptional()
  @IsString()
  liveUrl?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
