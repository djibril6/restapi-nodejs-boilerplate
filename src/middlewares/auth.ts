import httpStatus from 'http-status';
import { Request } from 'express';
import { ApiError } from '../utils';
import { tokenService, userService } from '../services';
import { global } from '../config';
import { IContext, EUserRole } from '../types';
import { AuthenticationError } from 'apollo-server-express';

export const auth = async (req: Request, ...requiredRights: string[]) => {
  try {
    if (!req.headers.authorization) {
      throw new Error();
    }
    const token = req.headers.authorization.split(' ')[1];
    const accessTokenDoc = await tokenService.verifyToken(token, global.tokenTypes.ACCESS);
    const user = await userService.getUserById(accessTokenDoc.user);
    if (!user || !requiredRights.includes(user.role)) {
      throw new Error();
    }
    return user;
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, '⛔ Please authenticate first!');
  }
};

export const graphQLAuthorization = (
  next: any,
  requiredRights: EUserRole[],
) => async (root: any, args: any, context: IContext, info: any) => {
  try {
    const token = context.req.headers.authorization || ''; // .split(' ')[1];
    if (!token) {
      throw new Error('⛔ Please authenticate first!');
    }
    const accessTokenDoc = await tokenService.verifyToken(token, global.tokenTypes.ACCESS);
    if (!context.user) {
      context.user = await userService.getUserById(accessTokenDoc.user);
    }

    if (!requiredRights.includes(context.user.role)) {
      throw new Error('⛔ You don\'t have access to this ressource!');
    }

    return next(root, args, context, info);
  } catch (error) {
    throw new AuthenticationError(error);
  }
};
