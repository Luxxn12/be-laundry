import { z } from 'zod';

export const listPaymentsSchema = {
  query: z.object({
    orderId: z.string().cuid().optional(),
    outletId: z.string().cuid().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
};
