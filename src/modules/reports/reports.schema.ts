import { z } from 'zod';

const baseQuery = z.object({
  outletId: z.string().cuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const salesReportSchema = { query: baseQuery };

export const topServicesSchema = {
  query: baseQuery.extend({
    limit: z.coerce.number().min(1).max(20).optional(),
  }),
};
