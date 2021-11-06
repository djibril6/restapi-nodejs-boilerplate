import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { authService, tokenService, emailService } from '../services';
import { catchReq } from '../utils';


const register = catchReq(async (req: Request, res: Response) => {
  const user = await authService.register(req.body);
  const tokens = await tokenService.generateAuthTokens(user.id);
  res.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchReq(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.login(email, password);
  const tokens = await tokenService.generateAuthTokens(user.id);
  res.send({ user, tokens });
});

const logout = catchReq(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchReq(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchReq(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchReq(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchReq(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchReq(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail
};
