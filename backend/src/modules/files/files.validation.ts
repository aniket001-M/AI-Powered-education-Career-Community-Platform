import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  Max,
  Min,
  IsIn,
} from 'class-validator';

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export class UploadFileDto {
  @IsString()
  @IsNotEmpty()
  originalName!: string;

  @IsString()
  @IsIn(ALLOWED_MIME_TYPES, {
    message: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
  })
  mimeType!: (typeof ALLOWED_MIME_TYPES)[number];

  @IsNumber()
  @Min(1)
  @Max(25 * 1024 * 1024, { message: 'File size cannot exceed 25MB' })
  size!: number;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = false;
}
