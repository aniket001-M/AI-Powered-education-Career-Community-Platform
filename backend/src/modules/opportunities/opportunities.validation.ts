import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsIn,
  IsArray,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export const VALID_OPPORTUNITY_TYPES = [
  'INTERNSHIP',
  'JOB',
  'SCHOLARSHIP',
  'HACKATHON',
  'COMPETITION',
  'CAMPUS_OPPORTUNITY',
] as const;

export const VALID_RISK_SIGNAL_TYPES = [
  'UNVERIFIED_EMAIL_DOMAIN',
  'UPFRONT_FEE_REQUEST',
  'SUSPICIOUS_TELEGRAM_LINK',
  'UNREALISTIC_COMPENSATION',
  'ANONYMOUS_RECRUITER',
  'OTHER',
] as const;

export class ListOpportunitiesDto {
  @IsOptional()
  @IsString()
  @IsIn(VALID_OPPORTUNITY_TYPES)
  type?: (typeof VALID_OPPORTUNITY_TYPES)[number];

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsString()
  skill?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'VERIFIED', 'REJECTED'])
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';

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

export class CreateOpportunityDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  company!: string;

  @IsString()
  @IsIn(VALID_OPPORTUNITY_TYPES)
  type!: (typeof VALID_OPPORTUNITY_TYPES)[number];

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsString()
  @IsNotEmpty()
  applyUrl!: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsString()
  eligibility?: string;

  @IsOptional()
  @IsString()
  stipendOrSalary?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];
}

export class UpdateOpportunityDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  @IsIn(VALID_OPPORTUNITY_TYPES)
  type?: (typeof VALID_OPPORTUNITY_TYPES)[number];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  applyUrl?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsString()
  eligibility?: string;

  @IsOptional()
  @IsString()
  stipendOrSalary?: string;
}

export class VerifyOpportunityDto {
  @IsString()
  @IsIn(['VERIFIED', 'REJECTED'])
  status!: 'VERIFIED' | 'REJECTED';
}

export class AddRiskSignalDto {
  @IsString()
  @IsIn(VALID_RISK_SIGNAL_TYPES)
  signalType!: (typeof VALID_RISK_SIGNAL_TYPES)[number];

  @IsString()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  severity!: 'LOW' | 'MEDIUM' | 'HIGH';

  @IsString()
  @IsNotEmpty()
  evidenceDescription!: string;
}
