import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsIn,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export const VALID_POST_TYPES = [
  'QUESTION',
  'EXPERIENCE',
  'RESOURCE',
  'INTERVIEW_EXPERIENCE',
  'OPPORTUNITY',
  'WARNING',
  'DISCUSSION',
] as const;

export class ListPostsDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  @IsIn(VALID_POST_TYPES)
  postType?: (typeof VALID_POST_TYPES)[number];

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  authorId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['latest', 'popular', 'mostCommented'])
  sort?: 'latest' | 'popular' | 'mostCommented' = 'latest';

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

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsOptional()
  @IsString()
  @IsIn(VALID_POST_TYPES)
  postType?: (typeof VALID_POST_TYPES)[number] = 'DISCUSSION';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsString()
  parentCommentId?: string;
}

export class ReportPostDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsOptional()
  @IsString()
  details?: string;
}
