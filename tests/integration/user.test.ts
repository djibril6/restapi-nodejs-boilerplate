import faker from 'faker';
import httpStatus from 'http-status';
import request from 'supertest';
import { User } from '../../src/models';
import app from '../../src/app';
import { EGender, EUserRole, IUser } from '../../src/types';
import { setupTestDB, tokenUtil, userUtil } from '../utils';


setupTestDB();
describe('User routes', () => {
  describe('POST /v1/users', () => {
    let newUser: IUser;

    beforeEach(() => {
      newUser = {
        firstname: faker.name.firstName(),
        lastname: faker.name.lastName(),
        email: faker.internet.email().toLowerCase(),
        role: EUserRole.ADMIN,
        gender: EGender.FEMALE
      };
    });

    test('should return 201 and successfully create new user if data is ok', async () => {
      await userUtil.insertUsers([userUtil.admin]);

      const res = await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${tokenUtil.adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.CREATED);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).toEqual({
        id: expect.anything(),
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        email: newUser.email,
        role: newUser.role,
        gender: newUser.gender,
        isEmailVerified: false,
        accountClosed: false
      });

      const dbUser = await User.findById(res.body.id);
      expect(dbUser).toBeDefined();
      expect(dbUser.password).not.toBe(newUser.password);
      expect(dbUser).toMatchObject({ firstname: newUser.firstname, lastname: newUser.lastname, email: newUser.email, role: newUser.role, gender: newUser.gender, isEmailVerified: false, accountClosed: false });
    });

    test('should return 403 error if logged in user is not admin', async () => {
      await userUtil.insertUsers([userUtil.userOne]);

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${tokenUtil.userOneAccessToken}`)
        .send(newUser)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 401 error if access token is missing', async () => {
      await request(app).post('/v1/users').send(newUser).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 400 error if email is invalid', async () => {
      await userUtil.insertUsers([userUtil.admin]);
      newUser.email = 'invalidEmail';

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${tokenUtil.adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if email is already used', async () => {
      await userUtil.insertUsers([userUtil.admin, userUtil.userOne]);
      newUser.email = userUtil.userOne.email;

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${tokenUtil.adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if password length is less than 8 characters', async () => {
      await userUtil.insertUsers([userUtil.admin]);
      newUser.password = 'passwo1';

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${tokenUtil.adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if password does not contain both letters and numbers', async () => {
      await userUtil.insertUsers([userUtil.admin]);
      newUser.password = 'password';

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${tokenUtil.adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);

      newUser.password = '1111111';

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${tokenUtil.adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /v1/users', () => {
    test('should return 200 and apply the default query options', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.userTwo, userUtil.admin]);

      const res = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${tokenUtil.adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 3,
      });
      expect(res.body.results).toHaveLength(3);
      expect(res.body.results[0]).toEqual({
        id: userUtil.userOne._id.toHexString(),
        firstname: userUtil.userOne.firstname,
        lastname: userUtil.userOne.lastname,
        email: userUtil.userOne.email,
        role: userUtil.userOne.role,
        gender: userUtil.userOne.gender,
        isEmailVerified: userUtil.userOne.isEmailVerified,
        accountClosed: userUtil.userOne.accountClosed,
      });
    });

    test('should return 403 if a non-admin is trying to access all users', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.userTwo, userUtil.admin]);

      await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${tokenUtil.userOneAccessToken}`)
        .send()
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 401 if access token is missing', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.userTwo, userUtil.admin]);

      await request(app).get('/v1/users').send().expect(httpStatus.UNAUTHORIZED);
    });

  

    test('should correctly apply filter on role field', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.userTwo, userUtil.admin]);

      const res = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${tokenUtil.adminAccessToken}`)
        .query({ role: EUserRole.USER })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 2,
      });
      expect(res.body.results).toHaveLength(2);
      expect(res.body.results[0].id).toBe(userUtil.userOne._id.toHexString());
      expect(res.body.results[1].id).toBe(userUtil.userTwo._id.toHexString());
    });

    test('should correctly sort the returned array if descending sort param is specified', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.userTwo, userUtil.admin]);

      const res = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${tokenUtil.adminAccessToken}`)
        .query({ sortBy: 'role:desc' })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 3,
      });
      expect(res.body.results).toHaveLength(3);
      expect(res.body.results[0].id).toBe(userUtil.userOne._id.toHexString());
      expect(res.body.results[1].id).toBe(userUtil.userTwo._id.toHexString());
      expect(res.body.results[2].id).toBe(userUtil.admin._id.toHexString());
    });

    test('should correctly sort the returned array if ascending sort param is specified', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.userTwo, userUtil.admin]);

      const res = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${tokenUtil.adminAccessToken}`)
        .query({ sortBy: 'role:asc' })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 3,
      });
      expect(res.body.results).toHaveLength(3);
      expect(res.body.results[0].id).toBe(userUtil.admin._id.toHexString());
      expect(res.body.results[1].id).toBe(userUtil.userOne._id.toHexString());
      expect(res.body.results[2].id).toBe(userUtil.userTwo._id.toHexString());
    });

    test('should limit returned array if limit param is specified', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.userTwo, userUtil.admin]);

      const res = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${tokenUtil.adminAccessToken}`)
        .query({ limit: 2 })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 2,
        totalPages: 2,
        totalResults: 3,
      });
      expect(res.body.results).toHaveLength(2);
      expect(res.body.results[0].id).toBe(userUtil.userOne._id.toHexString());
      expect(res.body.results[1].id).toBe(userUtil.userTwo._id.toHexString());
    });

    test('should return the correct page if page and limit params are specified', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.userTwo, userUtil.admin]);

      const res = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${tokenUtil.adminAccessToken}`)
        .query({ page: 2, limit: 2 })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 2,
        limit: 2,
        totalPages: 2,
        totalResults: 3,
      });
      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0].id).toBe(userUtil.admin._id.toHexString());
    });
  });

  describe('GET /v1/users/:userId', () => {
    test('should return 200 and the user object if data is ok', async () => {
      await userUtil.insertUsers([userUtil.userOne]);

      const res = await request(app)
        .get(`/v1/users/${userUtil.userOne._id}`)
        .set('Authorization', `Bearer ${tokenUtil.userOneAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).toEqual({
        id: userUtil.userOne._id.toHexString(),
        email: userUtil.userOne.email,
        firstname: userUtil.userOne.firstname,
        lastname: userUtil.userOne.lastname,
        role: userUtil.userOne.role,
        gender: userUtil.userOne.gender,
        isEmailVerified: userUtil.userOne.isEmailVerified,
        accountClosed: false
      });
    });

    test('should return 401 error if access token is missing', async () => {
      await userUtil.insertUsers([userUtil.userOne]);

      await request(app).get(`/v1/users/${userUtil.userOne._id}`).send().expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 error if user is trying to get another user', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.userTwo]);

      await request(app)
        .get(`/v1/users/${userUtil.userTwo._id}`)
        .set('Authorization', `Bearer ${tokenUtil.userOneAccessToken}`)
        .send()
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 200 and the user object if admin is trying to get another user', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.admin]);

      await request(app)
        .get(`/v1/users/${userUtil.userOne._id}`)
        .set('Authorization', `Bearer ${tokenUtil.adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);
    });

    test('should return 400 error if userId is not a valid mongo id', async () => {
      await userUtil.insertUsers([userUtil.admin]);

      await request(app)
        .get('/v1/users/invalidId')
        .set('Authorization', `Bearer ${tokenUtil.adminAccessToken}`)
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 error if user is not found', async () => {
      await userUtil.insertUsers([userUtil.admin]);

      await request(app)
        .get(`/v1/users/${userUtil.userOne._id}`)
        .set('Authorization', `Bearer ${tokenUtil.adminAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /v1/users/:userId', () => {
    test('should return 204 if data is ok', async () => {
      await userUtil.insertUsers([userUtil.userOne]);

      await request(app)
        .delete(`/v1/users/${userUtil.userOne._id}`)
        .set('Authorization', `Bearer ${tokenUtil.userOneAccessToken}`)
        .send()
        .expect(httpStatus.NO_CONTENT);

      const dbUser = await User.findById(userUtil.userOne._id);
      expect(dbUser).toBeNull();
    });

    test('should return 401 error if access token is missing', async () => {
      await userUtil.insertUsers([userUtil.userOne]);

      await request(app).delete(`/v1/users/${userUtil.userOne._id}`).send().expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 error if user is trying to delete another user', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.userTwo]);

      await request(app)
        .delete(`/v1/users/${userUtil.userTwo._id}`)
        .set('Authorization', `Bearer ${tokenUtil.userOneAccessToken}`)
        .send()
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 204 if admin is trying to delete another user', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.admin]);

      await request(app)
        .delete(`/v1/users/${userUtil.userOne._id}`)
        .set('Authorization', `Bearer ${tokenUtil.adminAccessToken}`)
        .send()
        .expect(httpStatus.NO_CONTENT);
    });

    test('should return 400 error if userId is not a valid mongo id', async () => {
      await userUtil.insertUsers([userUtil.admin]);

      await request(app)
        .delete('/v1/users/invalidId')
        .set('Authorization', `Bearer ${tokenUtil.adminAccessToken}`)
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 error if user already is not found', async () => {
      await userUtil.insertUsers([userUtil.admin]);

      await request(app)
        .delete(`/v1/users/${userUtil.userOne._id}`)
        .set('Authorization', `Bearer ${tokenUtil.adminAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /v1/users/:userId', () => {
    test('should return 200 and successfully update user if data is ok', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const updateBody = {
        firstname: faker.name.firstName(),
        lastname: faker.name.lastName(),
        email: faker.internet.email().toLowerCase(),
        password: 'newPassword1',
        gender: EGender.FEMALE
      };

      const res = await request(app)
        .patch(`/v1/users/${userUtil.userOne._id}`)
        .set('Authorization', `Bearer ${tokenUtil.userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).toEqual({
        id: userUtil.userOne._id.toHexString(),
        firstname: updateBody.firstname,
        lastname: updateBody.lastname,
        email: updateBody.email,
        role: EUserRole.USER,
        gender: updateBody.gender,
        isEmailVerified: false,
        accountClosed: false
      });

      const dbUser = await User.findById(userUtil.userOne._id);
      expect(dbUser).toBeDefined();
      expect(dbUser.password).not.toBe(updateBody.password);
      expect(dbUser).toMatchObject({ firstname: updateBody.firstname, lastname: updateBody.lastname, email: updateBody.email, role: EUserRole.USER });
    });

    test('should return 401 error if access token is missing', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const updateBody = { firstname: faker.name.firstName() };

      await request(app).patch(`/v1/users/${userUtil.userOne._id}`).send(updateBody).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 if user is updating another user', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.userTwo]);
      const updateBody = { firstname: faker.name.firstName() };

      await request(app)
        .patch(`/v1/users/${userUtil.userTwo._id}`)
        .set('Authorization', `Bearer ${tokenUtil.userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 200 and successfully update user if admin is updating another user', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.admin]);
      const updateBody = { firstname: faker.name.firstName() };

      await request(app)
        .patch(`/v1/users/${userUtil.userOne._id}`)
        .set('Authorization', `Bearer ${tokenUtil.adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);
    });

    test('should return 404 if admin is updating another user that is not found', async () => {
      await userUtil.insertUsers([userUtil.admin]);
      const updateBody = { firstname: faker.name.firstName() };

      await request(app)
        .patch(`/v1/users/${userUtil.userOne._id}`)
        .set('Authorization', `Bearer ${tokenUtil.adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.NOT_FOUND);
    });

    test('should return 400 error if userId is not a valid mongo id', async () => {
      await userUtil.insertUsers([userUtil.admin]);
      const updateBody = { firstname: faker.name.firstName() };

      await request(app)
        .patch('/v1/users/invalidId')
        .set('Authorization', `Bearer ${tokenUtil.adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if email is invalid', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const updateBody = { email: 'invalidEmail' };

      await request(app)
        .patch(`/v1/users/${userUtil.userOne._id}`)
        .set('Authorization', `Bearer ${tokenUtil.userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if email is already taken', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.userTwo]);
      const updateBody = { email: userUtil.userTwo.email };

      await request(app)
        .patch(`/v1/users/${userUtil.userOne._id}`)
        .set('Authorization', `Bearer ${tokenUtil.userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should not return 400 if email is my email', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const updateBody = { email: userUtil.userOne.email };

      await request(app)
        .patch(`/v1/users/${userUtil.userOne._id}`)
        .set('Authorization', `Bearer ${tokenUtil.userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);
    });

    test('should return 400 if password length is less than 8 characters', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const updateBody = { password: 'passwo1' };

      await request(app)
        .patch(`/v1/users/${userUtil.userOne._id}`)
        .set('Authorization', `Bearer ${tokenUtil.userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if password does not contain both letters and numbers', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const updateBody = { password: 'password' };

      await request(app)
        .patch(`/v1/users/${userUtil.userOne._id}`)
        .set('Authorization', `Bearer ${tokenUtil.userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);

      updateBody.password = '11111111';

      await request(app)
        .patch(`/v1/users/${userUtil.userOne._id}`)
        .set('Authorization', `Bearer ${tokenUtil.userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });
  });
});