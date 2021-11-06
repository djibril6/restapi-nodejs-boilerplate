import jwt from 'jsonwebtoken';
import moment, { Moment } from 'moment';
import httpStatus from 'http-status';
import { ObjectId } from 'mongoose';
import { config } from '../config';
import { Token } from '../models';
import { ApiError } from '../utils';
import { ETokenType, ITokenDocument } from '../types';
import { userService } from '.';


const generateToken = (userId: ObjectId, expires: Moment, type: ETokenType): string => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, config.jwt.secret);
};

const saveToken = async (token: string, userId: ObjectId, expires: Moment, type: ETokenType) => {
  const tokenDoc = await Token.create({
    token,
    user: userId,
    expires: expires.toDate(),
    type
  });
  return tokenDoc;
};


const verifyToken = async (token: string, type: ETokenType) => {
  let tokenDoc: ITokenDocument;
  const payload = jwt.verify(token, config.jwt.secret);
  if (type === ETokenType.ACCESS) {
    tokenDoc.user = payload.sub;
    tokenDoc.token = token;
    tokenDoc.type = type;
  } else {
    tokenDoc = await Token.findOne({ token, type, user: payload.sub});
  }
  if (!tokenDoc) {
    throw new Error('Token not found');
  }
  return tokenDoc;
};

/**
 * Generate access and refresh tokens
 */
const generateAuthTokens = async (userId: ObjectId) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(userId, accessTokenExpires, ETokenType.ACCESS);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(userId, refreshTokenExpires, ETokenType.REFRESH);
  await saveToken(refreshToken, userId, refreshTokenExpires, ETokenType.REFRESH);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

const generateResetPasswordToken = async (email: string) => {
  const user = await userService.getOneUser({email});
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
  }
  const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
  const resetPasswordToken = generateToken(user.id, expires, ETokenType.RESET_PASSWORD);
  await saveToken(resetPasswordToken, user.id, expires, ETokenType.RESET_PASSWORD);
  return resetPasswordToken;
};

const generateVerifyEmailToken = async (userId: ObjectId) => {
  const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
  const verifyEmailToken = generateToken(userId, expires, ETokenType.VERIFY_EMAIL);
  await saveToken(verifyEmailToken, userId, expires, ETokenType.VERIFY_EMAIL);
  return verifyEmailToken;
};

export default {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  generateResetPasswordToken,
  generateVerifyEmailToken,
};
