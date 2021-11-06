import winston from 'winston';
import { ENodeEnv } from '../types';
import { config } from '.';

const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    Object.assign(info, { message: info.stack });
  }
  return info;
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    enumerateErrorFormat(),
    winston.format.uncolorize(),
    winston.format.splat(),
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'warn.log', level: 'warn' }),
    new winston.transports.File({ filename: 'server-output.log' })
  ],
});

if (config.env !== ENodeEnv.PROD) {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      enumerateErrorFormat(),
      winston.format.colorize(),
      winston.format.splat(),
      winston.format.simple(),
      winston.format.printf(({ level, message }) => `${level}: ${message}`)
    )
  }));
}


export default logger;
