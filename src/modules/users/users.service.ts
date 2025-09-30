import bcrypt from 'bcrypt';

import { Prisma, UserRole } from '@prisma/client';

import { prisma } from '../../db/prisma';
import { ApiError } from '../../utils/api-error';
import type { AuthenticatedUser } from '../../middlewares/auth.middleware';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination';
import { registerUser } from '../auth/auth.service';
import type { RegisterInput } from '../auth/auth.types';

interface ListUsersQuery {
  search?: string;
  role?: UserRole;
  page?: string;
  limit?: string;
}

export async function listUsers(actor: AuthenticatedUser, query: ListUsersQuery) {
  const { page, limit, skip, take } = parsePagination(query);
  const where: Prisma.UserWhereInput = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.role) {
    where.role = query.role;
  }

  if (actor.role !== UserRole.SUPERADMIN) {
    if (!actor.outletId) {
      throw new ApiError(403, 'Outlet scope required');
    }
    where.outletId = actor.outletId;
  }

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        outletId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        outlet: { select: { id: true, name: true, code: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    meta: buildPaginationMeta(total, page, limit),
  };
}

export async function createUser(actor: AuthenticatedUser, input: RegisterInput) {
  const user = await registerUser(input, actor);

  return prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      outletId: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      outlet: { select: { id: true, name: true, code: true } },
    },
  });
}

export async function updateUser(actor: AuthenticatedUser, userId: string, data: Partial<Omit<RegisterInput, 'password'>> & { password?: string }) {
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    throw new ApiError(404, 'User not found');
  }

  if (target.role === UserRole.SUPERADMIN && actor.role !== UserRole.SUPERADMIN) {
    throw new ApiError(403, 'Cannot modify a superadmin');
  }

  if (actor.role !== UserRole.SUPERADMIN) {
    if (!actor.outletId || target.outletId !== actor.outletId) {
      throw new ApiError(403, 'Cannot modify user from another outlet');
    }

    if (data.role === UserRole.SUPERADMIN) {
      throw new ApiError(403, 'Cannot elevate role to superadmin');
    }
  }

  const updateData: Prisma.UserUncheckedUpdateInput = {};

  if (data.name) {
    updateData.name = data.name;
  }

  if (data.role) {
    updateData.role = data.role;
  }

  if (data.outletId !== undefined) {
    if (actor.role !== UserRole.SUPERADMIN && data.outletId && data.outletId !== actor.outletId) {
      throw new ApiError(403, 'Cannot reassign user to another outlet');
    }
    updateData.outletId = data.outletId ?? null;
  }

  if (typeof data.isActive === 'boolean') {
    updateData.isActive = data.isActive;
  }

  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }

  await prisma.user.update({ where: { id: userId }, data: updateData });

  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      outletId: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      outlet: { select: { id: true, name: true, code: true } },
    },
  });
}

export async function deleteUser(actor: AuthenticatedUser, userId: string) {
  if (actor.id === userId) {
    throw new ApiError(400, 'Cannot delete yourself');
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    throw new ApiError(404, 'User not found');
  }

  if (target.role === UserRole.SUPERADMIN) {
    throw new ApiError(403, 'Cannot delete superadmin');
  }

  if (actor.role !== UserRole.SUPERADMIN) {
    if (!actor.outletId || target.outletId !== actor.outletId) {
      throw new ApiError(403, 'Cannot delete user from another outlet');
    }
  }

  await prisma.user.delete({ where: { id: userId } });
}
