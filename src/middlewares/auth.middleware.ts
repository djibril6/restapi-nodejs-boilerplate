import { NextFunction, Request, Response } from 'express';
import { tokenService, userService } from '../services';
import { EUserRole, ETokenType } from '../types';

/**
 * Authentication and authorization
 */
export default (...requiredRoles: EUserRole[]) => async (req: Request, res: Response, next: NextFunction) => {
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
    next();
  } catch (error) {
    next(error);
  }
};