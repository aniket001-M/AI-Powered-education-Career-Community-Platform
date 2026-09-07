import {
  IsBoolean,
  IsOptional,
  IsString,
  IsIn,
  IsNotEmpty,
  MinLength,
  Matches,
} from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['light', 'dark', 'system'])
  theme?: 'light' | 'dark' | 'system';

  @IsOptional()
  @IsString()
  @IsIn(['PUBLIC', 'COLLEGE_ONLY', 'PRIVATE'])
  profileVisibility?: 'PUBLIC' | 'COLLEGE_ONLY' | 'PRIVATE';
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/, {
    message:
      'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  newPassword!: string;
}

export class DeleteAccountDto {
  @IsString()
  @IsNotEmpty()
  password!: string;
}
