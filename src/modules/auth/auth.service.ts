import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';

import { UserRole } from '@prisma/client';

import config from '../../config/env';
import { prisma } from '../../db/prisma';
import { ApiError } from '../../utils/api-error';
import type { AuthenticatedUser } from '../../middlewares/auth.middleware';
import type { AuthResponse, AuthTokens, LoginInput, RegisterInput, TokenPayload } from './auth.types';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function decodeExpiry(token: string): number {
  const payload = jwt.decode(token) as JwtPayload | null;
  if (!payload?.exp) {
    return 0;
  }
  return payload.exp * 1000;
}

async function generateTokens(userId: string, email: string, role: UserRole, outletId?: string | null): Promise<AuthTokens> {
  const refreshJti = crypto.randomUUID();
  const accessJti = crypto.randomUUID();

  const basePayload = {
    sub: userId,
    email,
    role,
    outletId: outletId ?? null,
  } satisfies Omit<TokenPayload, 'type' | 'jti'>;

  const accessOptions: SignOptions = {};
  accessOptions.expiresIn = config.JWT_ACCESS_EXPIRES as unknown as SignOptions['expiresIn'];

  const refreshOptions: SignOptions = {};
  refreshOptions.expiresIn = config.JWT_REFRESH_EXPIRES as unknown as SignOptions['expiresIn'];

  const accessToken = jwt.sign(
    { ...basePayload, type: 'access', jti: accessJti },
    config.JWT_ACCESS_SECRET,
    accessOptions
  );

  const refreshToken = jwt.sign(
    { ...basePayload, type: 'refresh', jti: refreshJti },
    config.JWT_REFRESH_SECRET,
    refreshOptions
  );

  const refreshExpiresAt = new Date(decodeExpiry(refreshToken));

  await prisma.refreshToken.create({
    data: {
      id: refreshJti,
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt: decodeExpiry(accessToken),
    refreshTokenExpiresAt: refreshExpiresAt.getTime(),
  };
}

export async function registerUser(input: RegisterInput, actor: AuthenticatedUser): Promise<AuthResponse['user']> {
  if (actor.role !== UserRole.SUPERADMIN && actor.role !== UserRole.ADMIN) {
    throw new ApiError(403, 'Insufficient permissions to register user');
  }

  if (input.role === UserRole.SUPERADMIN && actor.role !== UserRole.SUPERADMIN) {
    throw new ApiError(403, 'Only superadmin can create another superadmin');
  }

  const outletId = (() => {
    if (actor.role === UserRole.SUPERADMIN) {
      return input.outletId ?? null;
    }

    if (!actor.outletId) {
      throw new ApiError(400, 'Admin must belong to an outlet');
    }

    if (input.outletId && input.outletId !== actor.outletId) {
      throw new ApiError(403, 'Cannot assign user to a different outlet');
    }

    return actor.outletId;
  })();

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ApiError(409, 'Email already in use');
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  return prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      role: input.role,
      outletId,
      isActive: input.isActive ?? true,
    }
  });
}

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'User account is inactive');
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const tokens = await generateTokens(user.id, user.email, user.role, user.outletId);

  return {
    user,
    tokens,
  };
}

export async function refreshTokens(refreshToken: string): Promise<AuthResponse> {
  let payload: TokenPayload & JwtPayload;

  try {
    payload = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as TokenPayload & JwtPayload;
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }

  if (payload.type !== 'refresh' || !payload.jti) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const storedToken = await prisma.refreshToken.findUnique({ where: { id: payload.jti } });
  if (!storedToken) {
    throw new ApiError(401, 'Refresh token not recognized');
  }

  if (storedToken.revokedAt) {
    throw new ApiError(401, 'Refresh token already revoked');
  }

  if (storedToken.expiresAt.getTime() < Date.now()) {
    throw new ApiError(401, 'Refresh token expired');
  }

  const hashed = hashToken(refreshToken);
  if (hashed !== storedToken.tokenHash) {
    throw new ApiError(401, 'Refresh token mismatch');
  }

  const user = await prisma.user.findUnique({ where: { id: storedToken.userId } });
  if (!user) {
    throw new ApiError(401, 'User no longer exists');
  }

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await generateTokens(user.id, user.email, user.role, user.outletId);

  return { user, tokens };
}

export async function logoutUser(refreshToken: string): Promise<void> {
  let payload: TokenPayload & JwtPayload;

  try {
    payload = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as TokenPayload & JwtPayload;
  } catch {
    return; // token already invalid
  }

  if (!payload.jti) {
    return;
  }

  await prisma.refreshToken.updateMany({
    where: { id: payload.jti, tokenHash: hashToken(refreshToken) },
    data: { revokedAt: new Date() },
  });
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { outlet: true },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return user;
}
