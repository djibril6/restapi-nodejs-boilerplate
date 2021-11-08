import { NextFunction, Response } from 'express';
import { ApiError } from '../utils';
import { tokenService, userService } from '../services';
import { EUserRole, ETokenType, IAppRequest } from '../types';
import httpStatus from 'http-status';

/**
 * Authentication and authorization
 */
export default (...requiredRoles: EUserRole[]) => async (req: IAppRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.headers.authorization) {
      throw new ApiError(httpStatus.UNAUTHORIZED, '⛔ Please authenticate first!');
    }
    const token = req.headers.authorization.split(' ')[1];
    const accessTokenDoc = await tokenService.verifyToken(token, ETokenType.ACCESS);
    const user = await userService.getUserById(accessTokenDoc.user.toString());
    if (!user || (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user.role))) {
      throw new ApiError(httpStatus.FORBIDDEN, '⛔ You don\'t have access to this ressource!');
    }
    req.user = user._id;

    if (req.params.userId && user.role !== EUserRole.ADMIN) {
      if (user._id != req.params.userId) {
        throw new ApiError(httpStatus.FORBIDDEN, '⛔ You don\'t have access to this ressource!');
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};
