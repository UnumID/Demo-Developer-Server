// Application hooks that run for every service
import { HookContext } from '@feathersjs/feathers';
import { pick } from 'lodash';

import logger from './logger';

function logRequest (ctx: HookContext): void {
  const { path, method, id, data } = ctx;
  logger.info(`${path}#${method}${id ? ` id: ${id}` : ''}${data ? ` data: ${JSON.stringify(data)}}` : ''}`);
}

function logResult (ctx: HookContext): HookContext {
  const { path, method, result } = ctx;
  const string = JSON.stringify(result);
  const length = 1500; // prevent exceedingly long result log messages.
  const resultString = string.length < length ? string : string.substring(0, length - 3) + '...';

  logger.info(`${path}#${method} result: ${resultString}`);
  return ctx;
}

function logError (ctx: HookContext): void {
  const { path, method, error } = ctx;
  const { name, code, message } = error;
  const rawInfo = pick(ctx, ['params', 'id', 'data']);
  const info = { ...rawInfo };

  if (info.params?.headers?.authorization) {
    info.params.headers.authorization = 'Bearer *****';
  }

  if (info.params.authToken) {
    info.params.authToken = '*****';
  }

  logger.warn(`Error in ${path}#${method}: name=${name} code=${code} message=${message}`, info);
}

export default {
  before: {
    all: [logRequest],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [logResult],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [logError],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
