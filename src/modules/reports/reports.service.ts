import { Prisma, UserRole } from '@prisma/client';

import { prisma } from '../../db/prisma';
import { ApiError } from '../../utils/api-error';
import type { AuthenticatedUser } from '../../middlewares/auth.middleware';

interface ReportQuery {
  outletId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

function buildOrderWhere(actor: AuthenticatedUser, query: ReportQuery): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};

  if (actor.role !== UserRole.SUPERADMIN) {
    if (!actor.outletId) {
      throw new ApiError(403, 'Outlet scope required');
    }
    where.outletId = actor.outletId;
  } else if (query.outletId) {
    where.outletId = query.outletId;
  }

  if (query.dateFrom || query.dateTo) {
    where.createdAt = {
      gte: query.dateFrom,
      lte: query.dateTo,
    };
  }

  return where;
}

export async function getSalesReport(actor: AuthenticatedUser, query: ReportQuery) {
  const where = buildOrderWhere(actor, query);

  const orders = await prisma.order.findMany({
    where,
    select: {
      total: true,
      paidAmount: true,
      paymentStatus: true,
      outletId: true,
    },
  });

  const totalRevenue = orders.reduce((acc, order) => acc + Number(order.total), 0);
  const totalPaid = orders.reduce((acc, order) => acc + Number(order.paidAmount), 0);
  const paidOrders = orders.filter((order) => order.paymentStatus === 'PAID').length;
  const outstanding = orders.reduce((acc, order) => acc + (Number(order.total) - Number(order.paidAmount)), 0);

  return {
    totalRevenue,
    totalPaid,
    outstanding,
    orderCount: orders.length,
    paidOrderCount: paidOrders,
  };
}

export async function getTopServices(actor: AuthenticatedUser, query: ReportQuery & { limit?: number }) {
  const where = buildOrderWhere(actor, query);

  const group = await prisma.orderItem.groupBy({
    by: ['serviceId'],
    _sum: {
      lineTotal: true,
      qty: true,
    },
    where: {
      order: where,
    },
    orderBy: {
      _sum: { lineTotal: 'desc' },
    },
    take: query.limit ?? 5,
  });

  const serviceIds = group.map((item) => item.serviceId);
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, name: true, type: true, outletId: true },
  });

  const serviceMap = new Map(services.map((service) => [service.id, service]));

  return group.map((item) => ({
    service: serviceMap.get(item.serviceId),
    totalSales: Number(item._sum.lineTotal ?? 0),
    totalQty: Number(item._sum.qty ?? 0),
  }));
}
