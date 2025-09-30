import type { Order, OrderItem, OrderStatus, PaymentStatus, Voucher } from '@prisma/client';

export interface OrderItemInput {
  serviceId: string;
  qty: number;
}

export interface CreateOrderInput {
  outletId: string;
  customerId: string;
  items: OrderItemInput[];
  isExpress?: boolean;
  expressFee?: number;
  voucherCode?: string | null;
  notes?: string | null;
}

export interface UpdateOrderInput {
  status?: OrderStatus;
  notes?: string | null;
  isExpress?: boolean;
  expressFee?: number;
  readyAt?: Date | null;
  completedAt?: Date | null;
}

export interface PaymentInput {
  method: string;
  amount: number;
  note?: string | null;
}

export interface VoucherApplicationResult {
  discount: number;
  reason?: string;
}

export interface OrderWithRelations extends Order {
  items: OrderItem[];
  voucher: Voucher | null;
  payments: { amount: unknown }[];
}
