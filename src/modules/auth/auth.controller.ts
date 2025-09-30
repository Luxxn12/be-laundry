import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { successResponse } from '../../utils/response';
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshTokens,
  registerUser,
} from './auth.service';

export const registerHandler = async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const createdUser = await registerUser(req.body, user!);
  res.status(201).json(successResponse(createdUser, 'User registered'));
};

export const loginHandler = async (req: Request, res: Response) => {
  const result = await loginUser(req.body);
  res.json(successResponse(result, 'Login successful'));
};

export const refreshHandler = async (req: Request, res: Response) => {
  const result = await refreshTokens(req.body.refreshToken);
  res.json(successResponse(result, 'Token refreshed'));
};

export const logoutHandler = async (req: Request, res: Response) => {
  await logoutUser(req.body.refreshToken);
  res.json(successResponse({ success: true }, 'Logged out'));
};

export const meHandler = async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const currentUser = await getCurrentUser(user!.id);
  res.json(successResponse(currentUser, 'Current user'));
};
