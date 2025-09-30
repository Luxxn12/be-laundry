import { Prisma, UserRole } from '@prisma/client';

import { prisma } from '../../db/prisma';
import { ApiError } from '../../utils/api-error';
import type { AuthenticatedUser } from '../../middlewares/auth.middleware';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination';

interface ServiceQuery {
  type?: string;
  isActive?: string;
  outletId?: string;
  page?: string;
  limit?: string;
}

export async function listServices(actor: AuthenticatedUser, query: ServiceQuery) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Prisma.ServiceWhereInput = {};

  if (query.type) {
    where.type = { equals: query.type, mode: 'insensitive' };
  }

  if (query.isActive) {
    where.isActive = query.isActive === 'true';
  }

  if (query.outletId) {
    if (actor.role !== UserRole.SUPERADMIN && actor.outletId !== query.outletId) {
      throw new ApiError(403, 'Cannot access services of another outlet');
    }
    where.outletId = query.outletId;
  } else if (actor.role !== UserRole.SUPERADMIN) {
    if (!actor.outletId) {
      throw new ApiError(403, 'Outlet scope required');
    }
    where.outletId = actor.outletId;
  }

  const [services, total] = await prisma.$transaction([
    prisma.service.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.service.count({ where }),
  ]);

  return {
    data: services,
    meta: buildPaginationMeta(total, page, limit),
  };
}

export async function createService(actor: AuthenticatedUser, data: { outletId: string; name: string; type: string; unit: string; price: number; isActive?: boolean }) {
  if (actor.role !== UserRole.SUPERADMIN) {
    if (!actor.outletId || actor.outletId !== data.outletId) {
      throw new ApiError(403, 'Cannot create service for another outlet');
    }
  }

  return prisma.service.create({
    data: {
      outletId: data.outletId,
      name: data.name,
      type: data.type,
      unit: data.unit,
      price: new Prisma.Decimal(data.price),
      isActive: data.isActive ?? true,
    },
  });
}

export async function updateService(actor: AuthenticatedUser, id: string, data: { name?: string; type?: string; unit?: string; price?: number; isActive?: boolean }) {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    throw new ApiError(404, 'Service not found');
  }

  if (actor.role !== UserRole.SUPERADMIN) {
    if (!actor.outletId || actor.outletId !== service.outletId) {
      throw new ApiError(403, 'Cannot modify service from another outlet');
    }
  }

  const updateData: Prisma.ServiceUpdateInput = {};

  if (data.name) updateData.name = data.name;
  if (data.type) updateData.type = data.type;
  if (data.unit) updateData.unit = data.unit;
  if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive;
  if (typeof data.price === 'number') updateData.price = new Prisma.Decimal(data.price);

  return prisma.service.update({ where: { id }, data: updateData });
}

export async function deleteService(actor: AuthenticatedUser, id: string) {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    throw new ApiError(404, 'Service not found');
  }

  if (actor.role !== UserRole.SUPERADMIN) {
    if (!actor.outletId || actor.outletId !== service.outletId) {
      throw new ApiError(403, 'Cannot delete service from another outlet');
    }
  }

  await prisma.service.update({ where: { id }, data: { isActive: false } });
}
