import bcrypt from 'bcrypt';
import crypto from 'crypto';
import type { Express } from 'express';
import request from 'supertest';
import type { PrismaClient, UserRole } from '@prisma/client';
import { describe, expect, beforeAll, afterAll, it } from 'vitest';

const shouldRun = Boolean(process.env.DATABASE_URL);
const describeIf = shouldRun ? describe : describe.skip;

describeIf('Order lifecycle', () => {
  const password = 'Password123!';
  const unique = crypto.randomUUID();
  const superAdminEmail = `super-${unique}@test.com`;
  const outletCode = `OT${unique.slice(0, 4).toUpperCase()}`;

  let app: Express;
  let prisma: PrismaClient;
  let accessToken = '';
  let outletId = '';
  let serviceIds: string[] = [];
  let voucherCode = '';
  let customerId = '';

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET ??= 'test-access-secret';
    process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret';
    process.env.JWT_ACCESS_EXPIRES ??= '15m';
    process.env.JWT_REFRESH_EXPIRES ??= '7d';

    const [{ default: appInstance }, { prisma: prismaClient }, { UserRole }] = await Promise.all([
      import('../src/app'),
      import('../src/db/prisma'),
      import('@prisma/client'),
    ]);

    app = appInstance;
    prisma = prismaClient;

    await prisma.payment.deleteMany();
    await prisma.pickupDelivery.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.voucher.deleteMany();
    await prisma.service.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.user.deleteMany();
    await prisma.outlet.deleteMany();

    const outlet = await prisma.outlet.create({
      data: {
        code: outletCode,
        name: 'Test Outlet',
        address: '123 Test Street',
        phone: '+620000000000',
      },
    });
    outletId = outlet.id;

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email: superAdminEmail,
        name: 'E2E Super Admin',
        passwordHash,
        role: UserRole.SUPERADMIN,
      },
    });

    const serviceA = await prisma.service.create({
      data: {
        outletId,
        name: 'Wash',
        type: 'kiloan',
        unit: 'kg',
        price: 8000,
      },
    });

    const serviceB = await prisma.service.create({
      data: {
        outletId,
        name: 'Dry Clean',
        type: 'dry_clean',
        unit: 'item',
        price: 20000,
      },
    });

    serviceIds = [serviceA.id, serviceB.id];

    const voucher = await prisma.voucher.create({
      data: {
        code: 'TESTDISC',
        percentOff: 10,
        maxDiscount: 15000,
        minSubtotal: 10000,
        isActive: true,
      },
    });
    voucherCode = voucher.code;
  });

  afterAll(async () => {
    await prisma.payment.deleteMany();
    await prisma.pickupDelivery.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.voucher.deleteMany();
    await prisma.service.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.user.deleteMany();
    await prisma.outlet.deleteMany();
    await prisma.$disconnect();
  });

  it('logs in super admin', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      email: superAdminEmail,
      password,
    });

    expect(response.status).toBe(200);
    expect(response.body?.data?.tokens?.accessToken).toBeTruthy();

    accessToken = response.body.data.tokens.accessToken;
  });

  it('creates a customer', async () => {
    const response = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Order Customer',
        phone: '+628123456789',
        email: `customer-${unique}@test.com`,
        address: 'Jl. Test 123',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.id).toBeTruthy();
    customerId = response.body.data.id;
  });

  it('creates an order and marks it paid', async () => {
    const orderResponse = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        outletId,
        customerId,
        voucherCode,
        items: [
          { serviceId: serviceIds[0], qty: 3 },
          { serviceId: serviceIds[1], qty: 1 },
        ],
      });

    expect(orderResponse.status).toBe(201);
    const orderId = orderResponse.body.data.id;

    const paymentResponse = await request(app)
      .post(`/api/v1/orders/${orderId}/payments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ method: 'cash', amount: 100000 });

    expect(paymentResponse.status).toBe(201);

    const detailResponse = await request(app)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.data.paymentStatus).toBe('PAID');
  });
});
