import winston from 'winston';
import { ENodeEnv } from '../types';
import { config } from './';

const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    Object.assign(info, { message: info.stack });
  }
  return info;
});

const logger = winston.createLogger({
  level: config.env === ENodeEnv.DEV ? 'debug' : 'info',
  format: winston.format.combine(
    enumerateErrorFormat(),
    config.env === ENodeEnv.DEV ? winston.format.colorize() : winston.format.uncolorize(),
    winston.format.splat(),
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    config.env === ENodeEnv.DEV 
      ? winston.format.printf(({ level, message, timestamp }) => `${level}: at ${timestamp} - ${message}`)
      : winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'warn.log', level: 'warn' })
  ],
});


export default logger;
