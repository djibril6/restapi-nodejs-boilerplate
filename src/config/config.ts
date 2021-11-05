import dotenv from 'dotenv';
import Joi from 'joi';
import { ENodeEnv } from '../types';

dotenv.config({ path: '.env' });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid(ENodeEnv.PROD, ENodeEnv.DEV, ENodeEnv.TEST).required(),
    PORT: Joi.number().default(4000),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
};
export default config;
