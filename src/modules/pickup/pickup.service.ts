import { Prisma } from '@prisma/client';

import { prisma } from '../../db/prisma';
import { ApiError } from '../../utils/api-error';

interface PickupInput {
  pickupAddress?: string | null;
  deliveryAddress?: string | null;
  scheduledAt?: Date | null;
  courierId?: string | null;
}

export async function upsertPickup(orderId: string, data: PickupInput) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  return prisma.pickupDelivery.upsert({
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
}

export async function getPickup(orderId: string) {
  return prisma.pickupDelivery.findUnique({ where: { orderId } });
}
