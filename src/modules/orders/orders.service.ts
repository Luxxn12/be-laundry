import { Prisma, OrderStatus, PaymentStatus, UserRole } from '@prisma/client';

import { prisma } from '../../db/prisma';
import { ApiError } from '../../utils/api-error';
import { buildPaginationMeta, parsePagination, parseSort } from '../../utils/pagination';
import { applyVoucher } from '../vouchers/voucher.utils';
import { generateOrderCode } from './order-code.util';
import type { AuthenticatedUser } from '../../middlewares/auth.middleware';
import type {
  CreateOrderInput,
  OrderItemInput,
  PaymentInput,
  UpdateOrderInput,
} from './orders.types';

const FINAL_STATUSES = new Set<OrderStatus>([OrderStatus.COMPLETED, OrderStatus.CANCELED]);

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.RECEIVED, OrderStatus.CANCELED],
  [OrderStatus.RECEIVED]: [OrderStatus.WASHING, OrderStatus.CANCELED],
  [OrderStatus.WASHING]: [OrderStatus.DRYING, OrderStatus.CANCELED],
  [OrderStatus.DRYING]: [OrderStatus.IRONING, OrderStatus.CANCELED],
  [OrderStatus.IRONING]: [OrderStatus.READY, OrderStatus.CANCELED],
  [OrderStatus.READY]: [OrderStatus.DELIVERING, OrderStatus.COMPLETED, OrderStatus.CANCELED],
  [OrderStatus.DELIVERING]: [OrderStatus.COMPLETED, OrderStatus.CANCELED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELED]: [],
};

function assertOrderAccess(actor: AuthenticatedUser, outletId: string) {
  if (actor.role === UserRole.SUPERADMIN) {
    return;
  }

  if (!actor.outletId || actor.outletId !== outletId) {
    throw new ApiError(403, 'Forbidden: outlet mismatch');
  }
}

function ensureCanMutate(order: { status: OrderStatus }) {
  if (FINAL_STATUSES.has(order.status)) {
    throw new ApiError(400, 'Order can no longer be modified');
  }
}

async function recalculateOrderTotals(tx: Prisma.TransactionClient, orderId: string) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      voucher: true,
      payments: true,
    },
  });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const subtotal = order.items.reduce(
    (acc, item) => acc.add(item.lineTotal),
    new Prisma.Decimal(0),
  );

  let discount = new Prisma.Decimal(0);
  if (order.voucher) {
    const result = applyVoucher({ subtotal, voucher: order.voucher });
    discount = result.discount;
  }

  const expressFee = order.expressFee ?? new Prisma.Decimal(0);
  const total = subtotal.sub(discount).add(expressFee);
  const finalTotal = total.lessThan(0) ? new Prisma.Decimal(0) : total;

  const paidAmount = order.payments.reduce(
    (acc, payment) => acc.add(payment.amount),
    new Prisma.Decimal(0),
  );

  let paymentStatus: PaymentStatus = PaymentStatus.UNPAID;
  if (paidAmount.greaterThanOrEqualTo(finalTotal)) {
    paymentStatus = PaymentStatus.PAID;
  } else if (paidAmount.greaterThan(0)) {
    paymentStatus = PaymentStatus.PARTIAL;
  }

  await tx.order.update({
    where: { id: orderId },
    data: {
      subtotal,
      discount,
      total: finalTotal,
      paidAmount,
      paymentStatus,
    },
  });
}

async function buildOrderItems(outletId: string, items: OrderItemInput[]) {
  const serviceIds = items.map((item) => item.serviceId);
  const services = await prisma.service.findMany({
    where: {
      id: { in: serviceIds },
      outletId,
      isActive: true,
    },
  });

  if (services.length !== serviceIds.length) {
    throw new ApiError(400, 'Some services are invalid or inactive for this outlet');
  }

  const serviceMap = new Map(services.map((service) => [service.id, service]));

  const orderItems = items.map((item) => {
    const service = serviceMap.get(item.serviceId)!;
    const qty = new Prisma.Decimal(item.qty);
    const price = service.price;
    const lineTotal = price.mul(qty);

    return {
      serviceId: service.id,
      qty,
      price,
      lineTotal,
    };
  });

  const subtotal = orderItems.reduce((acc, item) => acc.add(item.lineTotal), new Prisma.Decimal(0));

  return { orderItems, subtotal };
}

export async function listOrders(actor: AuthenticatedUser, query: Record<string, any>) {
  const { page, limit, skip, take } = parsePagination(query);
  const where: Prisma.OrderWhereInput = {};

  if (query.status) {
    where.status = query.status as OrderStatus;
  }

  if (query.customerId) {
    where.customerId = query.customerId as string;
  }

  if (query.outletId) {
    assertOrderAccess(actor, query.outletId as string);
    where.outletId = query.outletId as string;
  } else if (actor.role !== UserRole.SUPERADMIN) {
    if (!actor.outletId) {
      throw new ApiError(403, 'Outlet scope required');
    }
    where.outletId = actor.outletId;
  }

  if (query.dateFrom || query.dateTo) {
    where.createdAt = {
      gte: query.dateFrom ? new Date(query.dateFrom as string) : undefined,
      lte: query.dateTo ? new Date(query.dateTo as string) : undefined,
    };
  }

  if (query.search) {
    where.OR = [
      { code: { contains: query.search as string, mode: 'insensitive' } },
      { customer: { name: { contains: query.search as string, mode: 'insensitive' } } },
      { customer: { phone: { contains: query.search as string, mode: 'insensitive' } } },
    ];
  }

  const sort = parseSort(query.sort as string | undefined);
  const orderBy: Prisma.OrderOrderByWithRelationInput[] = sort
    .map((sortItem) => {
      if (['createdAt', 'total', 'status'].includes(sortItem.field)) {
        return { [sortItem.field]: sortItem.direction } as Prisma.OrderOrderByWithRelationInput;
      }
      return null;
    })
    .filter(Boolean) as Prisma.OrderOrderByWithRelationInput[];

  if (!orderBy.length) {
    orderBy.push({ createdAt: 'desc' });
  }

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        customer: true,
        items: { include: { service: true } },
        payments: true,
        voucher: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    data: orders,
    meta: buildPaginationMeta(total, page, limit),
  };
}

export async function getOrder(actor: AuthenticatedUser, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      outlet: true,
      items: { include: { service: true } },
      payments: true,
      voucher: true,
      pickupDelivery: true,
    },
  });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  assertOrderAccess(actor, order.outletId);

  return order;
}

export async function createOrder(actor: AuthenticatedUser, input: CreateOrderInput) {
  assertOrderAccess(actor, input.outletId);

  const outlet = await prisma.outlet.findUnique({ where: { id: input.outletId } });
  if (!outlet) {
    throw new ApiError(404, 'Outlet not found');
  }

  const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  const { orderItems, subtotal } = await buildOrderItems(input.outletId, input.items);

  let voucher = null;
  if (input.voucherCode) {
    voucher = await prisma.voucher.findUnique({ where: { code: input.voucherCode.toUpperCase() } });
    if (!voucher) {
      throw new ApiError(404, 'Voucher not found');
    }
    const voucherResult = applyVoucher({ subtotal, voucher });
    if (voucherResult.discount.equals(0) && voucherResult.reason) {
      throw new ApiError(400, voucherResult.reason);
    }
  }

  const expressFee = input.isExpress ? new Prisma.Decimal(input.expressFee ?? 0) : new Prisma.Decimal(0);

  const order = await prisma.$transaction(async (tx) => {
    const code = await generateOrderCode(tx, input.outletId, outlet.code);

    let discount = new Prisma.Decimal(0);
    if (voucher) {
      const result = applyVoucher({ subtotal, voucher });
      discount = result.discount;
    }

    const total = subtotal.sub(discount).add(expressFee);
    const finalTotal = total.lessThan(0) ? new Prisma.Decimal(0) : total;

    const createdOrder = await tx.order.create({
      data: {
        code,
        outletId: input.outletId,
        customerId: input.customerId,
        status: OrderStatus.PENDING,
        isExpress: input.isExpress ?? false,
        expressFee: input.isExpress ? expressFee : undefined,
        notes: input.notes ?? undefined,
        subtotal,
        discount,
        total: finalTotal,
        voucherId: voucher?.id,
        createdById: actor.id,
        items: {
          create: orderItems.map((item) => ({
            serviceId: item.serviceId,
            qty: item.qty,
            price: item.price,
            lineTotal: item.lineTotal,
          })),
        },
      },
      include: {
        items: { include: { service: true } },
        customer: true,
        voucher: true,
      },
    });

    return createdOrder;
  });

  return order;
}

export async function updateOrder(actor: AuthenticatedUser, orderId: string, data: UpdateOrderInput) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  assertOrderAccess(actor, order.outletId);

  const updates: Prisma.OrderUpdateInput = {};

  if (data.status && data.status !== order.status) {
    const allowed = STATUS_TRANSITIONS[order.status];
    if (!allowed.includes(data.status)) {
      throw new ApiError(400, `Invalid status transition from ${order.status} to ${data.status}`);
    }
    updates.status = data.status;

    if (data.status === OrderStatus.CANCELED) {
      updates.canceledAt = new Date();
    }

    if (data.status === OrderStatus.COMPLETED) {
      updates.completedAt = data.completedAt ?? new Date();
    }
  }

  if (data.notes !== undefined) {
    updates.notes = data.notes;
  }

  if (typeof data.isExpress === 'boolean') {
    updates.isExpress = data.isExpress;
    if (!data.isExpress) {
      updates.expressFee = null;
    }
  }

  if (data.expressFee !== undefined) {
    if (!(typeof data.isExpress === 'boolean' ? data.isExpress : order.isExpress)) {
      throw new ApiError(400, 'Cannot set express fee for non-express order');
    }
    updates.expressFee = new Prisma.Decimal(data.expressFee);
  }

  if (data.readyAt !== undefined) {
    updates.readyAt = data.readyAt;
  }

  if (data.completedAt !== undefined) {
    updates.completedAt = data.completedAt;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.order.update({ where: { id: orderId }, data: updates });
    await recalculateOrderTotals(tx, orderId);
    return result;
  });

  return getOrder(actor, updated.id);
}

export async function addOrderItem(actor: AuthenticatedUser, orderId: string, item: OrderItemInput) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  assertOrderAccess(actor, order.outletId);
  ensureCanMutate(order);

  await prisma.$transaction(async (tx) => {
    const service = await tx.service.findUnique({ where: { id: item.serviceId } });
    if (!service || service.outletId !== order.outletId) {
      throw new ApiError(400, 'Service not available for this outlet');
    }

    const qty = new Prisma.Decimal(item.qty);
    await tx.orderItem.create({
      data: {
        orderId,
        serviceId: service.id,
        qty,
        price: service.price,
        lineTotal: service.price.mul(qty),
      },
    });

    await recalculateOrderTotals(tx, orderId);
  });

  return getOrder(actor, orderId);
}

export async function updateOrderItem(actor: AuthenticatedUser, orderId: string, itemId: string, qty: number) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  assertOrderAccess(actor, order.outletId);
  ensureCanMutate(order);

  await prisma.$transaction(async (tx) => {
    const item = await tx.orderItem.findUnique({ where: { id: itemId } });
    if (!item || item.orderId !== orderId) {
      throw new ApiError(404, 'Order item not found');
    }

    const newQty = new Prisma.Decimal(qty);
    await tx.orderItem.update({
      where: { id: itemId },
      data: {
        qty: newQty,
        lineTotal: item.price.mul(newQty),
      },
    });

    await recalculateOrderTotals(tx, orderId);
  });

  return getOrder(actor, orderId);
}

export async function removeOrderItem(actor: AuthenticatedUser, orderId: string, itemId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  assertOrderAccess(actor, order.outletId);
  ensureCanMutate(order);

  await prisma.$transaction(async (tx) => {
    const item = await tx.orderItem.findUnique({ where: { id: itemId } });
    if (!item || item.orderId !== orderId) {
      throw new ApiError(404, 'Order item not found');
    }
    await tx.orderItem.delete({ where: { id: itemId } });
    await recalculateOrderTotals(tx, orderId);
  });

  return getOrder(actor, orderId);
}

export async function addPayment(actor: AuthenticatedUser, orderId: string, input: PaymentInput) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  assertOrderAccess(actor, order.outletId);

  const payment = await prisma.$transaction(async (tx) => {
    const createdPayment = await tx.payment.create({
      data: {
        orderId,
        method: input.method,
        amount: new Prisma.Decimal(input.amount),
        note: input.note ?? undefined,
      },
    });

    await recalculateOrderTotals(tx, orderId);

    return createdPayment;
  });

  return payment;
}

export async function setPickup(actor: AuthenticatedUser, orderId: string, data: {
  pickupAddress?: string | null;
  deliveryAddress?: string | null;
  scheduledAt?: Date | null;
  courierId?: string | null;
}) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  assertOrderAccess(actor, order.outletId);

  const courierId = data.courierId;
  if (courierId) {
    const courier = await prisma.user.findUnique({ where: { id: courierId } });
    if (!courier || courier.role !== UserRole.COURIER) {
      throw new ApiError(400, 'Courier must be a valid courier user');
    }
    if (courier.outletId !== order.outletId) {
      throw new ApiError(403, 'Courier must belong to the same outlet');
    }
  }

  const pickup = await prisma.pickupDelivery.upsert({
    where: { orderId },
    create: {
      orderId,
      pickupAddress: data.pickupAddress ?? null,
      deliveryAddress: data.deliveryAddress ?? null,
      scheduledAt: data.scheduledAt ?? null,
      courierId: data.courierId ?? null,
    },
    update: {
      pickupAddress: data.pickupAddress ?? null,
      deliveryAddress: data.deliveryAddress ?? null,
      scheduledAt: data.scheduledAt ?? null,
      courierId: data.courierId ?? null,
    },
  });

  return pickup;
}

export async function cancelOrder(actor: AuthenticatedUser, orderId: string, reason?: string | null) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  assertOrderAccess(actor, order.outletId);

  if (order.status === OrderStatus.CANCELED) {
    return order;
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.CANCELED,
      canceledAt: new Date(),
      notes: reason ?? order.notes,
    },
  });

  return updated;
}
