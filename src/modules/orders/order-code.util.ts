import { Prisma } from '@prisma/client';
import { format } from 'date-fns';

export async function generateOrderCode(
  tx: Prisma.TransactionClient,
  outletId: string,
  outletCode: string,
  date: Date = new Date(),
): Promise<string> {
  const dateKey = format(date, 'yyyyMMdd');
  const sequence = await tx.orderSequence.upsert({
    where: { outletId_dateKey: { outletId, dateKey } },
    update: { seq: { increment: 1 } },
    create: { outletId, dateKey, seq: 1 },
  });

  const sequenceValue = sequence.seq.toString().padStart(4, '0');
  return `${outletCode.toUpperCase()}-${dateKey}-${sequenceValue}`;
}
