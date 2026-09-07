import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class StartInterviewDto {
  @IsString()
  @IsNotEmpty()
  careerId!: string;

  @IsOptional()
  @IsString()
  @IsIn(['EASY', 'MEDIUM', 'HARD'])
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM';
}

export class SubmitAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @IsString()
  @IsNotEmpty()
  answerText!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  durationSeconds?: number = 0;
}
