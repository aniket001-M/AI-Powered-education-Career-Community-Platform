import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';
import { UserRole } from '@/common/enums/roles.enum';

/**
 * Password policy: min 8 chars, 1 upper, 1 lower, 1 digit, 1 special.
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
const PASSWORD_MESSAGE =
  'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 digit, and 1 special character';

// ─── AUTH-01 Register ────────────────────────────────────────

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password!: string;

  @IsEnum(UserRole, {
    message: `Role must be one of: ${Object.values(UserRole).join(', ')}`,
  })
  @IsNotEmpty()
  role!: UserRole;
}

// ─── AUTH-02 Login ───────────────────────────────────────────

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

// ─── AUTH-03 Refresh ─────────────────────────────────────────

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

// ─── AUTH-06 Verify Email ────────────────────────────────────

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}

// ─── AUTH-07 Resend Verification ─────────────────────────────

export class ResendVerificationDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

// ─── AUTH-08 Forgot Password ─────────────────────────────────

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

// ─── AUTH-09 Reset Password ──────────────────────────────────

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  newPassword!: string;
}
