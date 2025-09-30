import { Prisma } from '@prisma/client';

import { prisma } from '../../db/prisma';
import { ApiError } from '../../utils/api-error';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination';

interface CustomerQuery {
  search?: string;
  page?: string;
  limit?: string;
}

export async function listCustomers(query: CustomerQuery) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Prisma.CustomerWhereInput = {};
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { phone: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [customers, total] = await prisma.$transaction([
    prisma.customer.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.customer.count({ where }),
  ]);

  return {
    data: customers,
    meta: buildPaginationMeta(total, page, limit),
  };
}

export async function createCustomer(data: Prisma.CustomerCreateInput) {
  return prisma.customer.create({ data });
}

export async function getCustomer(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { orders: { take: 5, orderBy: { createdAt: 'desc' } } },
  });

  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  return customer;
}

export async function updateCustomer(id: string, data: Prisma.CustomerUpdateInput) {
  try {
    return await prisma.customer.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new ApiError(404, 'Customer not found');
    }
    throw error;
  }
}

export async function deleteCustomer(id: string) {
  try {
    await prisma.customer.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new ApiError(404, 'Customer not found');
    }
    throw error;
  }
}
