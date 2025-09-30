import type { User, UserRole } from '@prisma/client';

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  outletId?: string | null;
  type: 'access' | 'refresh';
  jti: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export type RegisterInput = {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  outletId?: string | null;
  isActive?: boolean;
};

export type LoginInput = {
  email: string;
  password: string;
};
