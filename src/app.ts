import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';

import { config } from './config';
import { ENodeEnv } from './types';
import { routeV1 } from './routes';
import { ApiError } from './utils';
import httpStatus from 'http-status';
import { errorConverter, errorHandler } from './middlewares';


  
const app = express();

// set security HTTP headers
if (config.env === ENodeEnv.PROD) {
  app.use(helmet());
}

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// enable cors
app.use(cors());
app.options('*', cors());

// routes
app.use('/v1', routeV1);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert any error to an ApiError
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
