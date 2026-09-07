import { UserRole } from '@/common/enums/roles.enum';

/**
 * JWT access-token payload shape.
 */
export interface AccessTokenPayload {
  userId: string;
  email: string;
  roles: UserRole[];
}

/**
 * JWT refresh-token payload shape.
 */
export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  family: string;
}

/**
 * Auth response returned to the client on login/register/refresh.
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Full auth response including user info.
 */
export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    roles: UserRole[];
    avatar: string | null;
    isEmailVerified: boolean;
  };
  tokens: AuthTokens;
}
