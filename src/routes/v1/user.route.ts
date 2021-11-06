import express from 'express';
import { userValidation } from '../../validations';
import { auth, validate } from '../../middlewares';
import { userController } from '../../controllers';
import { EUserRole } from '../../types';

const router = express.Router();

router
  .route('/')
  .get(auth(EUserRole.ADMIN), validate(userValidation.getUsers), userController.getUsers);

router
  .route('/:userId')
  .get(auth(EUserRole.ADMIN, EUserRole.USER), validate(userValidation.getOneUser), userController.getOneUser)
  .patch(auth(EUserRole.ADMIN, EUserRole.USER), validate(userValidation.updateUser), userController.updateUser)
  .delete(auth(EUserRole.ADMIN, EUserRole.USER), validate(userValidation.deleteUser), userController.deleteUser);

export default router;
