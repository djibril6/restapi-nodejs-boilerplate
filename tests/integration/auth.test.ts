import faker from 'faker';
import httpStatus from 'http-status';
import httpMocks from 'node-mocks-http';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { Token, User } from '../../src/models';
import app from '../../src/app';
import { EGender, ETokenType, EUserRole, IUser } from '../../src/types';
import { setupTestDB } from '../utils';
import { tokenService } from '../../src/services';
import moment from 'moment';
import { ApiError } from '../../src/utils';

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
      });

      expect(res.body.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });

      const dbUser = await User.findById(res.body.user.id);
      expect(dbUser).toBeDefined();
      expect(dbUser.password).not.toBe(newUser.password); // password must be encrypted
      expect(dbUser).toMatchObject({ firstname: newUser.firstname, lastname: newUser.lastname, email: newUser.email, role: EUserRole.USER, gender: newUser.gender, isEmailVerified: false });
    });
  });
});