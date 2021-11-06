import express from 'express';
import { config } from '../../config';
import { ENodeEnv } from '../../types';
import authRoute from './auth.route';
import userRoute from './user.route';

const routes = express.Router();

routes.use('/auth', authRoute);
routes.use('/users', userRoute);

if (config.env === ENodeEnv.DEV) {
  
}

export default routes;