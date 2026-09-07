import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { UserRole } from '@/common/enums/roles.enum';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  roles: UserRole[];
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
}
