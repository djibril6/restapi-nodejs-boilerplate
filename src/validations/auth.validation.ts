import { EGender, EUserRole } from '../types';
import Joi from 'joi';
import { validation } from '.';

const createUser = {
  body: Joi.object().keys({
    firstname: Joi.string().required(),
    lastname: Joi.string().required(),
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(validation.password),
    role: Joi.string().required().valid(EUserRole.ADMIN, EUserRole.USER),
    gender: Joi.string().valid(EGender.FEMALE, EGender.MALE),
    isEmailVerified: Joi.forbidden(),
    accountClosed: Joi.forbidden()
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
};
  
const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};
  
const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};
  
const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};
  
const resetPassword = {
  query: Joi.object().keys({
    token: Joi.string().required().description('The generated reset password token getted from forgotPassword request'),
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(validation.password).description('Generated verify email token'),
  }),
};
  
const verifyEmail = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

export default {
  createUser,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail
};
