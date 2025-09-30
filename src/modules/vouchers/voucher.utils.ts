import { Prisma, Voucher } from '@prisma/client';

interface ApplyVoucherParams {
  subtotal: Prisma.Decimal;
  voucher: Voucher;
  now?: Date;
}

export function applyVoucher({ subtotal, voucher, now = new Date() }: ApplyVoucherParams) {
  if (!voucher.isActive) {
    return { discount: new Prisma.Decimal(0), reason: 'Voucher inactive' };
  }

  if (voucher.startsAt && now < voucher.startsAt) {
    return { discount: new Prisma.Decimal(0), reason: 'Voucher not started' };
  }

  if (voucher.endsAt && now > voucher.endsAt) {
    return { discount: new Prisma.Decimal(0), reason: 'Voucher expired' };
  }

  if (voucher.minSubtotal && subtotal.lessThan(voucher.minSubtotal)) {
    return { discount: new Prisma.Decimal(0), reason: 'Subtotal below minimum' };
  }

  let discount = new Prisma.Decimal(0);

  if (voucher.percentOff != null) {
    discount = subtotal.mul(new Prisma.Decimal(voucher.percentOff).dividedBy(100));
  } else if (voucher.flatOff) {
    discount = voucher.flatOff;
  }

  if (voucher.maxDiscount && discount.greaterThan(voucher.maxDiscount)) {
    discount = voucher.maxDiscount;
  }

  return { discount, reason: discount.equals(0) ? 'No discount applied' : undefined };
}
