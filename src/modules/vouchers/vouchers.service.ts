import { Prisma } from '@prisma/client';

import { prisma } from '../../db/prisma';
import { ApiError } from '../../utils/api-error';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination';

interface VoucherQuery {
  search?: string;
  isActive?: string;
  page?: string;
  limit?: string;
}

function toDecimal(value?: number | null) {
  return value != null ? new Prisma.Decimal(value) : undefined;
}

export async function listVouchers(query: VoucherQuery) {
  const { page, limit, skip, take } = parsePagination(query);
  const where: Prisma.VoucherWhereInput = {};

  if (query.search) {
    where.OR = [
      { code: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.isActive) {
    where.isActive = query.isActive === 'true';
  }

  const [vouchers, total] = await prisma.$transaction([
    prisma.voucher.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.voucher.count({ where }),
  ]);

  return {
    data: vouchers,
    meta: buildPaginationMeta(total, page, limit),
  };
}

export async function createVoucher(data: {
  code: string;
  description?: string | null;
  percentOff?: number | null;
  flatOff?: number | null;
  minSubtotal?: number | null;
  maxDiscount?: number | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  isActive?: boolean;
}) {
  return prisma.voucher.create({
    data: {
      code: data.code.toUpperCase(),
      description: data.description,
      percentOff: data.percentOff ?? undefined,
      flatOff: toDecimal(data.flatOff ?? undefined),
      minSubtotal: toDecimal(data.minSubtotal ?? undefined),
      maxDiscount: toDecimal(data.maxDiscount ?? undefined),
      startsAt: data.startsAt ?? undefined,
      endsAt: data.endsAt ?? undefined,
      isActive: data.isActive ?? true,
    },
  });
}

export async function updateVoucher(id: string, data: {
  code?: string;
  description?: string | null;
  percentOff?: number | null;
  flatOff?: number | null;
  minSubtotal?: number | null;
  maxDiscount?: number | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  isActive?: boolean;
}) {
  const updateData: Prisma.VoucherUpdateInput = {};

  if (data.code) updateData.code = data.code.toUpperCase();
  if (data.description !== undefined) updateData.description = data.description;
  if (data.percentOff !== undefined) updateData.percentOff = data.percentOff;
  if (data.flatOff !== undefined) updateData.flatOff = toDecimal(data.flatOff);
  if (data.minSubtotal !== undefined) updateData.minSubtotal = toDecimal(data.minSubtotal);
  if (data.maxDiscount !== undefined) updateData.maxDiscount = toDecimal(data.maxDiscount);
  if (data.startsAt !== undefined) updateData.startsAt = data.startsAt;
  if (data.endsAt !== undefined) updateData.endsAt = data.endsAt;
  if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive;

  try {
    return await prisma.voucher.update({ where: { id }, data: updateData });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new ApiError(404, 'Voucher not found');
    }
    throw error;
  }
}

export async function deleteVoucher(id: string) {
  const voucher = await prisma.voucher.findUnique({ where: { id } });
  if (!voucher) {
    throw new ApiError(404, 'Voucher not found');
  }

  await prisma.voucher.update({ where: { id }, data: { isActive: false } });
}
