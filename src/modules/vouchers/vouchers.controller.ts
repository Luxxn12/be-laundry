import type { Request, Response } from 'express';

import { successResponse } from '../../utils/response';
import {
  createVoucher,
  deleteVoucher,
  listVouchers,
  updateVoucher,
} from './vouchers.service';

export const listVouchersHandler = async (req: Request, res: Response) => {
  const result = await listVouchers(req.query);
  res.json(successResponse(result.data, 'Vouchers fetched', result.meta));
};

export const createVoucherHandler = async (req: Request, res: Response) => {
  const voucher = await createVoucher(req.body);
  res.status(201).json(successResponse(voucher, 'Voucher created'));
};

export const updateVoucherHandler = async (req: Request, res: Response) => {
  const voucher = await updateVoucher(req.params.id, req.body);
  res.json(successResponse(voucher, 'Voucher updated'));
};

export const deleteVoucherHandler = async (req: Request, res: Response) => {
  await deleteVoucher(req.params.id);
  res.status(204).send();
};
