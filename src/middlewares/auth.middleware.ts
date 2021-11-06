import { Request } from 'express';
import httpStatus from 'http-status';
import { ApiError } from '../utils';
import { tokenService, userService } from '../services';
import { EUserRole, ETokenType } from '../types';

/**
 * Authentication and authautization
 */
export default async (req: Request, ...requiredRoles: EUserRole[]) => {
  try {
    if (!req.headers.authorization) {
      throw new Error('⛔ Please authenticate first!');
    }
    const token = req.headers.authorization.split(' ')[1];
    const accessTokenDoc = await tokenService.verifyToken(token, ETokenType.ACCESS);
    const user = await userService.getUserById(accessTokenDoc.user.toString());
    if (!user || !requiredRoles.includes(user.role)) {
      throw new Error('⛔ You don\'t have access to this ressource!');
    }
    return user;
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, error.message);
  }
};