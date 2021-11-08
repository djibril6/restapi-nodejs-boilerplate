import httpStatus from 'http-status';
import { tokenService, userService } from './';
import { Token, User } from '../models';
import { ApiError } from '../utils';
import { ETokenType, IUser } from '../types';


const register = async (user: IUser) => {
  if (await User.isEmailTaken(user.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return User.create(user);
};

const login= async (email: string, password: string) => {
  const user = await userService.getOneUser({email});
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  return user;
};


/**
 * TODO --- Logout (Think about it) 
 */
const logout = async (refreshToken: string) => {
  const refreshTokenDoc = await Token.findOne({ token: refreshToken, type: ETokenType.REFRESH });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
  }
  await refreshTokenDoc.remove();
};

/**
 * Renew authentication tokens
 */
const refreshAuth = async (refreshToken: string) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, ETokenType.REFRESH);
    const userId = refreshTokenDoc.user.toString();
    await refreshTokenDoc.remove();
    return await tokenService.generateAuthTokens(userId);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Refresh token error');
  }
};

const resetPassword = async (userId: string, newPassword: string) => {
  try {
    await userService.updateUserById(userId, { password: newPassword });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
  }
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise}
 */
const verifyEmail = async (verifyEmailToken: string) => {
  try {
    const verifyEmailTokenDoc = await tokenService.verifyToken(verifyEmailToken, ETokenType.VERIFY_EMAIL);
    const user = await userService.getUserById(verifyEmailTokenDoc.user.toString());
    if (!user) {
      throw new Error();
    }
    await Token.deleteMany({ user: user.id, type: ETokenType.VERIFY_EMAIL });
    await userService.updateUserById(user.id, { isEmailVerified: true });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed');
  }
};

export default {
  register,
  login,
  refreshAuth,
  resetPassword,
  verifyEmail,
  logout
};
