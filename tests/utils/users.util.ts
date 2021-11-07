import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import faker from 'faker';
import { EGender, EUserRole } from '../../src/types';
import { User } from '../../src/models';

const password = 'password1';
const salt = bcrypt.genSaltSync(8);
const hashedPassword = bcrypt.hashSync(password, salt);

const userOne = {
  _id: new mongoose.Types.ObjectId(),
  firstname: faker.name.firstName(),
  lastname: faker.name.lastName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: EUserRole.USER,
  gender: EGender.MALE,
  isEmailVerified: false,
};

const userTwo = {
  _id: new mongoose.Types.ObjectId(),
  firstname: faker.name.firstName(),
  lastname: faker.name.lastName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: EUserRole.USER,
  gender: EGender.FEMALE,
  isEmailVerified: false,
};

const admin = {
  _id: new mongoose.Types.ObjectId(),
  firstname: faker.name.firstName(),
  lastname: faker.name.lastName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: EUserRole.ADMIN,
  gender: EGender.MALE,
  isEmailVerified: false,
};

const insertUsers = async (users) => {
  await User.insertMany(users.map((user) => ({ ...user, password: hashedPassword })));
};

export default {
  userOne,
  userTwo,
  admin,
  hashedPassword,
  insertUsers
};
