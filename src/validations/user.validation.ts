import { EGender, EUserRole } from 'enums/app.enum';
import Joi from 'joi';
import { validation } from '.';

const getUsers = {
  query: Joi.object().keys({
    role: Joi.string().valid(EUserRole.ADMIN, EUserRole.USER),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getOneUser = {
  params: Joi.object().keys({
    id: Joi.string().custom(validation.objectId),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.required().custom(validation.objectId),
  }),
  body: Joi.object().keys({
    email: Joi.string().email(),
    password: Joi.string().custom(validation.password),
    firstname: Joi.string(),
    lastname: Joi.string(),
    gender: Joi.string().valid(EGender.FEMALE, EGender.MALE),
    role: Joi.forbidden(),
  }).min(1),
};

const deleteUser = {
  params: Joi.object().keys({
    id: Joi.string().custom(validation.objectId).description('user Id'),
  }),
};

export default {
  getUsers,
  getOneUser,
  updateUser,
  deleteUser
};
