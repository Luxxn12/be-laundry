import bcrypt from 'bcrypt';
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  PrismaClient,
  UserRole,
} from '@prisma/client';
import { addDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.payment.deleteMany(),
    prisma.pickupDelivery.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.voucher.deleteMany(),
    prisma.service.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.user.deleteMany(),
    prisma.orderSequence.deleteMany(),
    prisma.outlet.deleteMany(),
  ]);

  const outletAlpha = await prisma.outlet.create({
    data: {
      code: 'OUT1',
      name: 'Laundry Alpha',
      address: '123 Clean Street',
      phone: '+621234567890',
    },
  });

  const outletBeta = await prisma.outlet.create({
    data: {
      code: 'OUT2',
      name: 'Laundry Beta',
      address: '456 Fresh Avenue',
      phone: '+629876543210',
    },
  });

  const superAdminPassword = await bcrypt.hash('SuperSecure123!', 10);
  const adminPassword = await bcrypt.hash('AdminSecure123!', 10);
  const cashierPassword = await bcrypt.hash('CashierSecure123!', 10);

  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@laundry.test',
      name: 'Super Admin',
      passwordHash: superAdminPassword,
      role: UserRole.SUPERADMIN,
    },
  });

  const outletAdmin = await prisma.user.create({
    data: {
      email: 'admin@laundryalpha.test',
      name: 'Outlet Admin',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      outletId: outletAlpha.id,
    },
  });

  await prisma.user.create({
    data: {
      email: 'cashier@laundryalpha.test',
      name: 'Outlet Cashier',
      passwordHash: cashierPassword,
      role: UserRole.CASHIER,
      outletId: outletAlpha.id,
    },
  });

  const kiloanService = await prisma.service.create({
    data: {
      outletId: outletAlpha.id,
      name: 'Cuci Kiloan',
      type: 'kiloan',
      unit: 'kg',
      price: new Prisma.Decimal(7000),
    },
  });

  const dryCleanService = await prisma.service.create({
    data: {
      outletId: outletAlpha.id,
      name: 'Dry Clean Jas',
      type: 'dry_clean',
      unit: 'item',
      price: new Prisma.Decimal(25000),
    },
  });

  await prisma.service.create({
    data: {
      outletId: outletBeta.id,
      name: 'Cuci Express',
      type: 'kiloan',
      unit: 'kg',
      price: new Prisma.Decimal(12000),
    },
  });

  const percentVoucher = await prisma.voucher.create({
    data: {
      code: 'DISC10',
      description: 'Diskon 10%',
      percentOff: 10,
      minSubtotal: new Prisma.Decimal(50000),
      maxDiscount: new Prisma.Decimal(20000),
      startsAt: addDays(new Date(), -30),
      endsAt: addDays(new Date(), 30),
    },
  });

  await prisma.voucher.create({
    data: {
      code: 'FLAT5000',
      description: 'Potongan flat 5000',
      flatOff: new Prisma.Decimal(5000),
      minSubtotal: new Prisma.Decimal(30000),
      startsAt: addDays(new Date(), -30),
      endsAt: addDays(new Date(), 30),
    },
  });

  const customer = await prisma.customer.create({
    data: {
      name: 'John Doe',
      phone: '+628111111111',
      email: 'john.doe@test.com',
      address: 'Jl. Mawar No. 1',
    },
  });

  const item1Total = kiloanService.price.mul(new Prisma.Decimal(5));
  const item2Total = dryCleanService.price.mul(new Prisma.Decimal(2));
  const subtotal = item1Total.add(item2Total);
  const rawDiscount = subtotal.mul(new Prisma.Decimal('0.1'));
  const discount = Prisma.Decimal.min(rawDiscount, new Prisma.Decimal(20000));
  const total = subtotal.sub(discount);

  const order = await prisma.order.create({
    data: {
      code: 'OUT1-20240101-0001',
      outletId: outletAlpha.id,
      customerId: customer.id,
      status: OrderStatus.PENDING,
      subtotal,
      discount,
      total,
      paidAmount: total,
      paymentStatus: PaymentStatus.PAID,
      voucherId: percentVoucher.id,
      createdById: outletAdmin.id,
      items: {
        create: [
          {
            serviceId: kiloanService.id,
            qty: new Prisma.Decimal(5),
            price: kiloanService.price,
            lineTotal: item1Total,
          },
          {
            serviceId: dryCleanService.id,
            qty: new Prisma.Decimal(2),
            price: dryCleanService.price,
            lineTotal: item2Total,
          },
        ],
      },
    },
    include: {
      items: true,
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order.id,
      method: 'cash',
      amount: total,
      note: 'Full payment at drop-off',
    },
  });

  await prisma.pickupDelivery.create({
    data: {
      orderId: order.id,
      pickupAddress: 'Jl. Mawar No. 1',
      deliveryAddress: 'Jl. Melati No. 2',
      scheduledAt: addDays(new Date(), 1),
      courierId: superAdmin.id,
    },
  });

  console.info('Seeding completed');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
