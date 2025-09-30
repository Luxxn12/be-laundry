import { Prisma, UserRole } from '@prisma/client';

import { prisma } from '../../db/prisma';
import { ApiError } from '../../utils/api-error';
import type { AuthenticatedUser } from '../../middlewares/auth.middleware';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination';

interface PaymentQuery {
  orderId?: string;
  outletId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: string;
  limit?: string;
}

export async function listPayments(actor: AuthenticatedUser, query: PaymentQuery) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Prisma.PaymentWhereInput = {};

  if (query.orderId) {
    where.orderId = query.orderId;
  }

  if (query.dateFrom || query.dateTo) {
    where.createdAt = {
      gte: query.dateFrom,
      lte: query.dateTo,
    }; // undefined values ignored by Prisma
  }

  if (actor.role !== UserRole.SUPERADMIN) {
    if (!actor.outletId) {
      throw new ApiError(403, 'Outlet scope required');
    }
    where.order = { outletId: actor.outletId };
  } else if (query.outletId) {
    where.order = { outletId: query.outletId };
  }

  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            code: true,
            outletId: true,
            total: true,
            paymentStatus: true,
          },
        },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    data: payments,
    meta: buildPaginationMeta(total, page, limit),
  };
}
