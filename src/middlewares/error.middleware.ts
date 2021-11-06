import httpStatus from 'http-status';
import { config, logger } from '../config';
import { ApiError } from '../utils';
import { NextFunction, Request, Response } from 'express';
import { ENodeEnv } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errorConverter = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || httpStatus[statusCode];
    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err: ApiError, req: Request, res: Response) => {
  let { statusCode, message } = err;
  if (config.env === ENodeEnv.PROD && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR].toString();
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(config.env === ENodeEnv.DEV && { stack: err.stack }),
  };

  logger.error(err);

  res.status(statusCode).send(response);
};

export { errorConverter, errorHandler };
