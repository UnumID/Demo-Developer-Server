import logger from './logger';
import generateApp from './generate-app';

(async () => {
  const app = await generateApp();
  const port = app.get('port');
  const server = app.listen(port);

  process.on('unhandledRejection', (reason, p) =>
    logger.error('Unhandled Rejection at: Promise ', p, reason)
  );

  server.on('listening', () =>
    logger.info('Feathers application started on http://%s:%d', app.get('host'), port)
  );
})();
