import httpStatus from 'http-status';
import { FilterQuery, ObjectId } from 'mongoose';
import { User } from '../models';
import { IUserDocument, IPaginateOption } from '../types';
import { ApiError } from '../utils';


const createUser = async (userBody: IUserDocument) => {
  if (userBody.email && await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return User.create(userBody);
};


const getUsers = async (filter: FilterQuery<IUserDocument>, options: IPaginateOption) => {
  const users = await User.paginate(filter, options);
  return users;
};

const getUserById = async (id: ObjectId) => {
  return await User.findById(id);
};

const getOneUser = async (filter: FilterQuery<IUserDocument>) => {
  return await User.findOne(filter);
};

const updateUserById = async (userId: ObjectId, updateBody: IUserDocument) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId: ObjectId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.remove();
  return user;
};

export default {
  createUser,
  getUserById,
  updateUserById,
  deleteUserById,
  getOneUser,
  getUsers
};
