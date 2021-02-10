import { createLogger, format, transports } from 'winston';
import { Syslog } from 'winston-syslog';
import os from 'os';

import { config } from './config';
import winston from 'winston/lib/winston/config';

const localhost = os.hostname();
const options = {
  host: 'logs.papertrailapp.com',
  port: config.PAPERTRAIL_PORT,
  app_name: 'test-customer-app',
  localhost
};

// Configure the Winston logger. For the complete documentation see https://github.com/winstonjs/winston
const logger = createLogger({
  // To see more detailed errors, change this to 'debug'
  levels: winston.syslog.levels,
  format: format.combine(
    format.splat(),
    format.timestamp(),
    format.errors({ stack: true }),
    format.simple()
  ),
  transports: [
    new transports.Console({
      level: config.LOG_LEVEL || 'info',
      format: format.combine(
        format.splat(),
        format.timestamp(),
        format.colorize(),
        format.errors({ stack: true }),
        format.simple()
      )
    }), // Turns out Winston defaults to info but just setting default explicitly anyway.
    new Syslog(options)
  ],
  silent: config.NODE_ENV === 'test'
});

export default logger;
