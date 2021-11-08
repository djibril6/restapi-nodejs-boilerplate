import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { IUser } from '../types';
import { authService, userService } from '../services';
import { ApiError, catchReq, pick } from '../utils';

const createUser = catchReq(async (req: Request, res: Response) => {
  const data: IUser = req.body;
  data.password = 'password1';
  const user = await authService.register(data);
  res.status(httpStatus.CREATED).send(user);
});
const getUsers = catchReq(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.getUsers(filter, options);
  res.send(result);
});

const getOneUser = catchReq(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

const updateUser = catchReq(async (req: Request, res: Response) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

const deleteUser = catchReq(async (req: Request, res: Response) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  createUser,
  getUsers,
  getOneUser,
  updateUser,
  deleteUser
};
