// Application hooks that run for every service
import { HookContext } from '@feathersjs/feathers';
import { pick } from 'lodash';

import logger from './logger';

function logRequest (ctx: HookContext): void {
  const { path, method, id } = ctx;
  logger.info(`${path}#${method}${id ? ` id: ${id}` : ''}`);
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
    all: [],
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
