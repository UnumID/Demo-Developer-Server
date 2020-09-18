import { createLogger, format, transports } from 'winston';
import { Syslog } from 'winston-syslog';
import os from 'os';

import { config } from './config';

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
  level: 'info',
  format: format.combine(
    format.splat(),
    format.timestamp(),
    format.colorize(),
    format.errors({ stack: true }),
    format.simple()
  ),
  transports: [
    new transports.Console(),
    new Syslog(options)
  ],
  silent: config.NODE_ENV === 'test'
});

export default logger;
