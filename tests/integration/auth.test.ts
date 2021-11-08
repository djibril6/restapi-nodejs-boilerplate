import faker from 'faker';
import httpStatus from 'http-status';
import httpMocks from 'node-mocks-http';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import moment from 'moment';
import { Token, User } from '../../src/models';
import app from '../../src/app';
import { EGender, ETokenType, EUserRole, IUser } from '../../src/types';
import { setupTestDB, tokenUtil, userUtil } from '../utils';
import { tokenService } from '../../src/services';
import { ApiError } from '../../src/utils';
import { config } from '../../src/config';
import { auth } from '../../src/middlewares';

setupTestDB();

describe('Auth routes', () => {
  describe('POST /v1/auth/register', () => {
    let newUser: IUser;
    beforeEach(() => {
      newUser = {
        firstname: faker.name.firstName(),
        lastname: faker.name.lastName(),
        email: faker.internet.email().toLowerCase(),
        gender: EGender.MALE,
        password: 'password1',
      };
    });

    test('should return 201 and successfully register user if request data is ok', async () => {
      const res = await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.CREATED);

      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user).toEqual({
        id: expect.anything(),
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        email: newUser.email,
        role: EUserRole.USER,
        gender: newUser.gender,
        isEmailVerified: false,
        accountClosed: false
      });

      expect(res.body.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });

      const dbUser = await User.findById(res.body.user.id);
      expect(dbUser).toBeDefined();
      expect(dbUser.password).not.toBe(newUser.password); // password must be encrypted
      expect(dbUser).toMatchObject({ 
        firstname: newUser.firstname, 
        lastname: newUser.lastname, 
        email: newUser.email, 
        role: EUserRole.USER, 
        gender: newUser.gender, 
        isEmailVerified: false,
        accountClosed: false
      });
    });

    test('should return 400 error if email is invalid', async () => {
      newUser.email = 'invalidEmail';

      await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if email is already used', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      newUser.email = userUtil.userOne.email;

      await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if password length is less than 8 characters', async () => {
      newUser.password = 'passwo1';

      await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if password does not contain both letters and numbers', async () => {
      newUser.password = 'password';

      await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);

      newUser.password = '11111111';

      await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('POST /v1/auth/login', () => {
    test('should return 200 and login user if email and password match', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const loginCredentials = {
        email: userUtil.userOne.email,
        password: userUtil.userOne.password,
      };

      const res = await request(app).post('/v1/auth/login').send(loginCredentials).expect(httpStatus.OK);

      expect(res.body.user).toEqual({
        id: expect.anything(),
        firstname: userUtil.userOne.firstname,
        lastname: userUtil.userOne.lastname,
        email: userUtil.userOne.email,
        role: userUtil.userOne.role,
        gender: userUtil.userOne.gender,
        isEmailVerified: userUtil.userOne.isEmailVerified,
        accountClosed: userUtil.userOne.accountClosed
      });

      expect(res.body.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });
    });

    test('should return 401 error if there are no users with that email or password', async () => {
      const loginCredentials = {
        email: userUtil.userOne.email,
        password: userUtil.userOne.password,
      };

      await request(app).post('/v1/auth/login').send(loginCredentials).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 error if email is incorrect', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const loginCredentials = {
        email: 'wrongemail@mail.com',
        password: userUtil.userOne.password,
      };

      await request(app).post('/v1/auth/login').send(loginCredentials).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 error if password is wrong', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const loginCredentials = {
        email: userUtil.userOne.email,
        password: 'wrongPassword1',
      };

      await request(app).post('/v1/auth/login').send(loginCredentials).expect(httpStatus.UNAUTHORIZED);
    });

    describe('POST /v1/auth/logout', () => {
      test('should return 204 if refresh token is valid', async () => {
        await userUtil.insertUsers([userUtil.userOne]);
        const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
        const refreshToken = tokenService.generateToken(userUtil.userOne._id.toString(), expires, ETokenType.REFRESH);
        await tokenService.saveToken(refreshToken, userUtil.userOne._id.toString(), expires, ETokenType.REFRESH);

        await request(app).post('/v1/auth/logout').send({ refreshToken }).expect(httpStatus.NO_CONTENT);

        const dbRefreshTokenDoc = await Token.findOne({ token: refreshToken });
        expect(dbRefreshTokenDoc).toBe(null);
      });

      test('should return 400 error if refresh token is missing from request body', async () => {
        await request(app).post('/v1/auth/logout').send().expect(httpStatus.BAD_REQUEST);
      });

      test('should return 404 error if refresh token is not found in the database', async () => {
        await userUtil.insertUsers([userUtil.userOne]);
        const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
        const refreshToken = tokenService.generateToken(userUtil.userOne._id.toString(), expires, ETokenType.REFRESH);

        await request(app).post('/v1/auth/logout').send({ refreshToken }).expect(httpStatus.NOT_FOUND);
      });
    });

    describe('POST /v1/auth/refresh-tokens', () => {
      test('should return 200 and new auth tokens if refresh token is valid', async () => {
        await userUtil.insertUsers([userUtil.userOne]);
        const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
        const refreshToken = tokenService.generateToken(userUtil.userOne._id.toString(), expires, ETokenType.REFRESH);
        await tokenService.saveToken(refreshToken, userUtil.userOne._id.toString(), expires, ETokenType.REFRESH);

        const res = await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken }).expect(httpStatus.OK);

        expect(res.body).toEqual({
          access: { token: expect.anything(), expires: expect.anything() },
          refresh: { token: expect.anything(), expires: expect.anything() },
        });

        const dbRefreshTokenDoc = await Token.findOne({ token: res.body.refresh.token });
        expect(dbRefreshTokenDoc).toMatchObject({ type: ETokenType.REFRESH, user: userUtil.userOne._id });

        const dbRefreshTokenCount = await Token.countDocuments();
        expect(dbRefreshTokenCount).toBe(1);
      });

      test('should return 400 error if refresh token is missing from request body', async () => {
        await request(app).post('/v1/auth/refresh-tokens').send().expect(httpStatus.BAD_REQUEST);
      });

      test('should return 401 error if refresh token is not found in the database', async () => {
        await userUtil.insertUsers([userUtil.userOne]);
        const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
        const refreshToken = tokenService.generateToken(userUtil.userOne._id.toString(), expires, ETokenType.REFRESH);

        await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken }).expect(httpStatus.UNAUTHORIZED);
      });

      test('should return 401 error if refresh token is expired', async () => {
        await userUtil.insertUsers([userUtil.userOne]);
        const expires = moment().subtract(1, 'minutes');
        const refreshToken = tokenService.generateToken(userUtil.userOne._id.toString(), expires, ETokenType.REFRESH);
        await tokenService.saveToken(refreshToken, userUtil.userOne._id.toString(), expires, ETokenType.REFRESH);

        await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken }).expect(httpStatus.UNAUTHORIZED);
      });
    });
    

    describe('POST /v1/auth/reset-password', () => {
      test('should return 204 and reset the password', async () => {
        await userUtil.insertUsers([userUtil.userOne]);
        const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
        const resetPasswordToken = tokenService.generateToken(userUtil.userOne._id.toString(), expires, ETokenType.RESET_PASSWORD);
        await tokenService.saveToken(resetPasswordToken, userUtil.userOne._id.toString(), expires, ETokenType.RESET_PASSWORD);

        await request(app)
          .post('/v1/auth/reset-password')
          .query({ token: resetPasswordToken })
          .send({ password: 'password2' })
          .expect(httpStatus.NO_CONTENT);

        const dbUser = await User.findById(userUtil.userOne._id);
        const isPasswordMatch = await bcrypt.compare('password2', dbUser.password);
        expect(isPasswordMatch).toBe(true);
      });

      test('should return 400 if reset password token is missing', async () => {
        await userUtil.insertUsers([userUtil.userOne]);

        await request(app).post('/v1/auth/reset-password').send({ password: 'password2' }).expect(httpStatus.BAD_REQUEST);
      });


      test('should return 401 if reset password token is expired', async () => {
        await userUtil.insertUsers([userUtil.userOne]);
        const expires = moment().subtract(1, 'minutes');
        const resetPasswordToken = tokenService.generateToken(userUtil.userOne._id.toString(), expires, ETokenType.RESET_PASSWORD);
        await tokenService.saveToken(resetPasswordToken, userUtil.userOne._id.toString(), expires, ETokenType.RESET_PASSWORD);

        await request(app)
          .post('/v1/auth/reset-password')
          .query({ token: resetPasswordToken })
          .send({ password: 'password2' })
          .expect(httpStatus.UNAUTHORIZED);
      });

      test('should return 401 if user is not found', async () => {
        const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
        const resetPasswordToken = tokenService.generateToken(userUtil.userOne._id.toString(), expires, ETokenType.RESET_PASSWORD);
        await tokenService.saveToken(resetPasswordToken, userUtil.userOne._id.toString(), expires, ETokenType.RESET_PASSWORD);

        await request(app)
          .post('/v1/auth/reset-password')
          .query({ token: resetPasswordToken })
          .send({ password: 'password2' })
          .expect(httpStatus.UNAUTHORIZED);
      });

      test('should return 400 if password is missing or invalid', async () => {
        await userUtil.insertUsers([userUtil.userOne]);
        const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
        const resetPasswordToken = tokenService.generateToken(userUtil.userOne._id.toString(), expires, ETokenType.RESET_PASSWORD);
        await tokenService.saveToken(resetPasswordToken, userUtil.userOne._id.toString(), expires, ETokenType.RESET_PASSWORD);

        await request(app).post('/v1/auth/reset-password').query({ token: resetPasswordToken }).expect(httpStatus.BAD_REQUEST);

        await request(app)
          .post('/v1/auth/reset-password')
          .query({ token: resetPasswordToken })
          .send({ password: 'short1' })
          .expect(httpStatus.BAD_REQUEST);

        await request(app)
          .post('/v1/auth/reset-password')
          .query({ token: resetPasswordToken })
          .send({ password: 'password' })
          .expect(httpStatus.BAD_REQUEST);

        await request(app)
          .post('/v1/auth/reset-password')
          .query({ token: resetPasswordToken })
          .send({ password: '11111111' })
          .expect(httpStatus.BAD_REQUEST);
      });
    });

    describe('POST /v1/auth/send-verification-email', () => {

      test('should return 401 error if access token is missing', async () => {
        await userUtil.insertUsers([userUtil.userOne]);

        await request(app).post('/v1/auth/send-verification-email').send().expect(httpStatus.UNAUTHORIZED);
      });
    });

    describe('POST /v1/auth/verify-email', () => {
      test('should return 204 and verify the email', async () => {
        await userUtil.insertUsers([userUtil.userOne]);
        const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
        const verifyEmailToken = tokenService.generateToken(userUtil.userOne._id.toString(), expires, ETokenType.VERIFY_EMAIL);
        await tokenService.saveToken(verifyEmailToken, userUtil.userOne._id.toString(), expires, ETokenType.VERIFY_EMAIL);

        await request(app)
          .post('/v1/auth/verify-email')
          .query({ token: verifyEmailToken })
          .send()
          .expect(httpStatus.NO_CONTENT);

        const dbUser = await User.findById(userUtil.userOne._id);

        expect(dbUser.isEmailVerified).toBe(true);

        const dbVerifyEmailToken = await Token.countDocuments({
          user: userUtil.userOne._id.toString(),
          type: ETokenType.VERIFY_EMAIL,
        });
        expect(dbVerifyEmailToken).toBe(0);
      });

      test('should return 400 if verify email token is missing', async () => {
        await userUtil.insertUsers([userUtil.userOne]);

        await request(app).post('/v1/auth/verify-email').send().expect(httpStatus.BAD_REQUEST);
      });

      test('should return 401 if verify email token is expired', async () => {
        await userUtil.insertUsers([userUtil.userOne]);
        const expires = moment().subtract(1, 'minutes');
        const verifyEmailToken = tokenService.generateToken(userUtil.userOne._id.toString(), expires, ETokenType.VERIFY_EMAIL);
        await tokenService.saveToken(verifyEmailToken, userUtil.userOne._id.toString(), expires, ETokenType.VERIFY_EMAIL);

        await request(app)
          .post('/v1/auth/verify-email')
          .query({ token: verifyEmailToken })
          .send()
          .expect(httpStatus.UNAUTHORIZED);
      });

      test('should return 401 if user is not found', async () => {
        const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
        const verifyEmailToken = tokenService.generateToken(userUtil.userOne._id.toString(), expires, ETokenType.VERIFY_EMAIL);
        await tokenService.saveToken(verifyEmailToken, userUtil.userOne._id.toString(), expires, ETokenType.VERIFY_EMAIL);

        await request(app)
          .post('/v1/auth/verify-email')
          .query({ token: verifyEmailToken })
          .send()
          .expect(httpStatus.UNAUTHORIZED);
      });
    });
  });

  describe('Auth middleware', () => {
    test('should call next with no errors if access token is valid', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
      const accessToken = tokenService.generateToken(userUtil.userOne._id.toString(), accessTokenExpires, ETokenType.ACCESS);
      const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${accessToken}` } });
      const next = jest.fn();

      await auth(EUserRole.USER)(req, httpMocks.createResponse(), next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toEqual(userUtil.userOne._id);
    });

    test('should call next with unauthorized error if access token is not found in header', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const req = httpMocks.createRequest();
      const next = jest.fn();

      await auth(EUserRole.USER)(req, httpMocks.createResponse(), next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    });

    test('should call next with unauthorized error if access token is not a valid jwt token', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const req = httpMocks.createRequest({ headers: { Authorization: 'Bearer randomToken' } });
      const next = jest.fn();

      await auth()(req, httpMocks.createResponse(), next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    });

    test('should call next with unauthorized error if the token is not an access token', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const expires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
      const refreshToken = tokenService.generateToken(userUtil.userOne._id.toString(), expires, ETokenType.REFRESH);
      const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${refreshToken}` } });
      const next = jest.fn();

      await auth()(req, httpMocks.createResponse(), next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    });

    test('should call next with unauthorized error if user is not found', async () => {
      const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${tokenUtil.userOneAccessToken}` } });
      const next = jest.fn();

      await auth()(req, httpMocks.createResponse(), next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    });

    test('should call next with forbidden error if user does not have required rights and userId is not in params', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${tokenUtil.userOneAccessToken}` } });
      const next = jest.fn();

      await auth(EUserRole.ADMIN)(req, httpMocks.createResponse(), next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    });

    test('should call next with no errors if user has required rights', async () => {
      await userUtil.insertUsers([userUtil.admin]);
      const req = httpMocks.createRequest({
        headers: { Authorization: `Bearer ${tokenUtil.adminAccessToken}` },
        params: { userId: userUtil.userOne._id.toHexString() },
      });
      const next = jest.fn();

      await auth(EUserRole.ADMIN)(req, httpMocks.createResponse(), next);

      expect(next).toHaveBeenCalledWith();
    });
  });
});