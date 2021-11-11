import dotenv from 'dotenv';
import Joi from 'joi';
import { ENodeEnv } from '../types';

dotenv.config({ path: '.env' });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid(ENodeEnv.PROD, ENodeEnv.DEV, ENodeEnv.TEST).required(),
    PORT: Joi.number().default(4000),
    MONGODB_URL: Joi.string().required().description('url for mongodb'),
    MONGODB_URL_DEV: Joi.string().required().description('url for mongodb in development'),
    TOKEN_SECRET: Joi.string().required().description('JWT secret key'),
    TOKEN_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
    TOKEN_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
    TOKEN_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which reset password token expires'),
    TOKEN_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which verify email token expires'),
    HOST: Joi.string().default('http://127.0.0.1').description('Application base url or hostname'),
    SENDGRID_API_KEY: Joi.string().required().description('Sendgrid api key required'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export default {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  host: envVars.HOST,
  mongoose: {
    url: envVars.NODE_ENV === ENodeEnv.PROD 
      ? envVars.MONGODB_URL
      : envVars.MONGODB_URL_DEV + (envVars.NODE_ENV === ENodeEnv.TEST ? '-test' : ''),
    options: {
      autoIndex: true
    },
  },
  jwt: {
    secret: envVars.TOKEN_SECRET,
    accessExpirationMinutes: envVars.TOKEN_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.TOKEN_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: envVars.TOKEN_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.TOKEN_VERIFY_EMAIL_EXPIRATION_MINUTES,
  },
  email: {
    sendgridAPIKey: envVars.SENDGRID_API_KEY
  }
};
