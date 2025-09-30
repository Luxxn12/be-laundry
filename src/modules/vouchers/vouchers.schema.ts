import { z } from 'zod';

const voucherParams = z.object({
  id: z.string().cuid(),
});

const voucherCreateBody = z
  .object({
    code: z.string().min(3).max(20).toUpperCase(),
    description: z.string().optional().nullable(),
    percentOff: z.coerce.number().int().min(0).max(100).optional().nullable(),
    flatOff: z.coerce.number().min(0).optional().nullable(),
    minSubtotal: z.coerce.number().min(0).optional().nullable(),
    maxDiscount: z.coerce.number().min(0).optional().nullable(),
    startsAt: z.coerce.date().optional().nullable(),
    endsAt: z.coerce.date().optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.percentOff == null && data.flatOff == null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Either percentOff or flatOff must be provided' });
    }
    if (data.startsAt && data.endsAt && data.startsAt > data.endsAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'startsAt cannot be after endsAt' });
    }
  });

const voucherUpdateBody = z
  .object({
    code: z.string().min(3).max(20).toUpperCase().optional(),
    description: z.string().optional().nullable(),
    percentOff: z.coerce.number().int().min(0).max(100).optional().nullable(),
    flatOff: z.coerce.number().min(0).optional().nullable(),
    minSubtotal: z.coerce.number().min(0).optional().nullable(),
    maxDiscount: z.coerce.number().min(0).optional().nullable(),
    startsAt: z.coerce.date().optional().nullable(),
    endsAt: z.coerce.date().optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'At least one field must be provided' });
    }
    if (data.percentOff == null && data.flatOff == null &&
        ['percentOff', 'flatOff'].some((key) => key in data)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Either percentOff or flatOff must be provided' });
    }
    if (data.startsAt && data.endsAt && data.startsAt > data.endsAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'startsAt cannot be after endsAt' });
    }
  });

export const listVoucherSchema = {
  query: z.object({
    search: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
};

export const createVoucherSchema = { body: voucherCreateBody };

export const updateVoucherSchema = {
  params: voucherParams,
  body: voucherUpdateBody,
};

export const voucherIdParamSchema = { params: voucherParams };
