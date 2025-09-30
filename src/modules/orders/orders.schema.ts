import { z } from 'zod';

import { OrderStatus } from '@prisma/client';

const orderParams = z.object({
  id: z.string().cuid(),
});

const orderItemInput = z.object({
  serviceId: z.string().cuid(),
  qty: z.coerce.number().positive(),
});

export const listOrdersSchema = {
  query: z.object({
    status: z.nativeEnum(OrderStatus).optional(),
    customerId: z.string().cuid().optional(),
    outletId: z.string().cuid().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
  }),
};

export const createOrderSchema = {
  body: z.object({
    outletId: z.string().cuid(),
    customerId: z.string().cuid(),
    items: z.array(orderItemInput).min(1),
    isExpress: z.boolean().optional(),
    expressFee: z.coerce.number().min(0).optional(),
    voucherCode: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
};

export const orderIdParamSchema = {
  params: orderParams,
};

export const updateOrderSchema = {
  params: orderParams,
  body: z
    .object({
      status: z.nativeEnum(OrderStatus).optional(),
      notes: z.string().optional().nullable(),
      isExpress: z.boolean().optional(),
      expressFee: z.coerce.number().min(0).optional(),
      readyAt: z.coerce.date().optional().nullable(),
      completedAt: z.coerce.date().optional().nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
};

export const addOrderItemSchema = {
  params: orderParams,
  body: orderItemInput,
};

export const updateOrderItemSchema = {
  params: orderParams.extend({
    itemId: z.string().cuid(),
  }),
  body: z.object({
    qty: z.coerce.number().positive(),
  }),
};

export const orderItemIdParamSchema = {
  params: orderParams.extend({
    itemId: z.string().cuid(),
  }),
};

export const createPaymentSchema = {
  params: orderParams,
  body: z.object({
    method: z.string().min(1),
    amount: z.coerce.number().positive(),
    note: z.string().optional().nullable(),
  }),
};

export const pickupSchema = {
  params: orderParams,
  body: z.object({
    pickupAddress: z.string().optional().nullable(),
    deliveryAddress: z.string().optional().nullable(),
    scheduledAt: z.coerce.date().optional().nullable(),
    courierId: z.string().cuid().optional().nullable(),
  }),
};

export const cancelOrderSchema = {
  params: orderParams,
  body: z.object({
    reason: z.string().optional().nullable(),
  }),
};
