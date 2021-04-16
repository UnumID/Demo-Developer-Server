import { Application } from '../declarations';
import { Request, Response, NextFunction } from 'express';
import logger from '../logger';
import { RequestContext } from 'mikro-orm';

export default function (_app: Application): void {
// Log network requests. Note: only works for HTTP requests, not websocket communications.
  _app.use((req: Request, res: Response, next: NextFunction): void => {
    logger.info(`Request Info: method: ${req.method}, url: ${req.url}, params: ${JSON.stringify(req.params)}, body: ${JSON.stringify(req.body)}`);
    next();
  });

  _app.use((req: Request, res: Response, next: NextFunction) => {
    // As a fix for .flush validation errors, ref: https://mikro-orm.io/docs/faq/#you-cannot-call-emflush-from-inside-lifecycle-hook-handlers
    // Having a unique Mikro-ORM request context per request. ref: https://mikro-orm.io/docs/identity-map/#!
    RequestContext.create(_app.get('orm').em, next);
  });
}
