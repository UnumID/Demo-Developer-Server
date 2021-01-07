import { Application } from '../declarations';
import { Request, Response, NextFunction } from 'express';
import logger from '../logger';

// Don't remove this comment. It's needed to format import lines nicely.

// eslint-disable-next-line @typescript-eslint/no-empty-function
export default function (_app: Application): void {
// Log network requests. Note: only works for HTTP requests, not websocket communications.
  _app.use((req: Request, res: Response, next: NextFunction): void => {
    logger.info(`Request Info: method: ${req.method}, url: ${req.url}, params: ${JSON.stringify(req.params)}, body: ${JSON.stringify(req.body)}`);
    next();
  });
}
