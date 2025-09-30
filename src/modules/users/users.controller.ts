import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { successResponse } from '../../utils/response';
import { createUser, deleteUser, listUsers, updateUser } from './users.service';

export const listUsersHandler = async (req: AuthenticatedRequest, res: Response) => {
  const result = await listUsers(req.user!, req.query);
  res.json(successResponse(result.data, 'Users fetched', result.meta));
};

export const createUserHandler = async (req: AuthenticatedRequest, res: Response) => {
  const user = await createUser(req.user!, req.body);
  res.status(201).json(successResponse(user, 'User created'));
};

export const updateUserHandler = async (req: AuthenticatedRequest, res: Response) => {
  const user = await updateUser(req.user!, req.params.id, req.body);
  res.json(successResponse(user, 'User updated'));
};

export const deleteUserHandler = async (req: AuthenticatedRequest, res: Response) => {
  await deleteUser(req.user!, req.params.id);
  res.status(204).send();
};
