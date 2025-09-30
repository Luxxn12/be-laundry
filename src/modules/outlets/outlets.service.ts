import { Prisma, UserRole } from '@prisma/client';

import { prisma } from '../../db/prisma';
import { ApiError } from '../../utils/api-error';
import type { AuthenticatedUser } from '../../middlewares/auth.middleware';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination';

interface OutletQuery {
  search?: string;
  page?: string;
  limit?: string;
}

export async function listOutlets(actor: AuthenticatedUser, query: OutletQuery) {
  if (actor.role !== UserRole.SUPERADMIN) {
    throw new ApiError(403, 'Only superadmin can list all outlets');
  }

  const { page, limit, skip, take } = parsePagination(query);
  const where: Prisma.OutletWhereInput = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { code: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [outlets, total] = await prisma.$transaction([
    prisma.outlet.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.outlet.count({ where }),
  ]);

  return {
    data: outlets,
    meta: buildPaginationMeta(total, page, limit),
  };
}

export async function getOutlet(actor: AuthenticatedUser, id: string) {
  const outlet = await prisma.outlet.findUnique({ where: { id } });
  if (!outlet) {
    throw new ApiError(404, 'Outlet not found');
  }

  if (actor.role !== UserRole.SUPERADMIN && actor.outletId !== outlet.id) {
    throw new ApiError(403, 'Cannot access other outlets');
  }

  return outlet;
}

export async function createOutlet(actor: AuthenticatedUser, data: Prisma.OutletCreateInput) {
  if (actor.role !== UserRole.SUPERADMIN) {
    throw new ApiError(403, 'Only superadmin can create outlet');
  }

  return prisma.outlet.create({ data });
}

export async function updateOutlet(actor: AuthenticatedUser, id: string, data: Prisma.OutletUpdateInput) {
  if (actor.role !== UserRole.SUPERADMIN) {
    throw new ApiError(403, 'Only superadmin can update outlet');
  }

  return prisma.outlet.update({ where: { id }, data });
}

export async function deleteOutlet(actor: AuthenticatedUser, id: string) {
  if (actor.role !== UserRole.SUPERADMIN) {
    throw new ApiError(403, 'Only superadmin can delete outlet');
  }

  await prisma.outlet.delete({ where: { id } });
}
