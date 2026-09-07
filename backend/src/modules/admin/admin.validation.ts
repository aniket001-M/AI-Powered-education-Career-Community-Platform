import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsIn,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ALL_ROLES, UserRole } from '../../common/enums/roles.enum';

export class QueryUsersDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  @IsOptional()
  @IsArray()
  @IsIn(ALL_ROLES, { each: true })
  roles?: UserRole[];
}

export class QueryReportsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsIn(['PENDING', 'REVIEWED', 'DISMISSED', 'ACTION_TAKEN'])
  status?: 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'ACTION_TAKEN';
}

export class ResolveReportDto {
  @IsIn(['REVIEWED', 'DISMISSED', 'ACTION_TAKEN'])
  status!: 'REVIEWED' | 'DISMISSED' | 'ACTION_TAKEN';

  @IsOptional()
  @IsString()
  actionTaken?: string;

  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}

class SalaryRangeDto {
  @IsNumber()
  min!: number;

  @IsNumber()
  max!: number;

  @IsOptional()
  @IsString()
  currency?: string = 'INR';
}

export class CreateCareerDto {
  @IsString()
  title!: string;

  @IsString()
  category!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  overview?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SalaryRangeDto)
  salaryRange?: SalaryRangeDto;

  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH', 'EMERGING'])
  demandLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'EMERGING';

  @IsOptional()
  @IsString()
  growthRate?: string;
}

export class UpdateCareerDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  overview?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SalaryRangeDto)
  salaryRange?: SalaryRangeDto;

  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH', 'EMERGING'])
  demandLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'EMERGING';

  @IsOptional()
  @IsString()
  growthRate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateSkillDto {
  @IsString()
  name!: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsIn(['FOUNDATIONAL', 'INTERMEDIATE', 'ADVANCED'])
  level?: 'FOUNDATIONAL' | 'INTERMEDIATE' | 'ADVANCED';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateSkillDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsIn(['FOUNDATIONAL', 'INTERMEDIATE', 'ADVANCED'])
  level?: 'FOUNDATIONAL' | 'INTERMEDIATE' | 'ADVANCED';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
