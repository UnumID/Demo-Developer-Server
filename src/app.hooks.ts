// Application hooks that run for every service
import { BadRequest } from '@feathersjs/errors';
import { HookContext } from '@feathersjs/feathers';
import { pick } from 'lodash';
import { valid } from 'semver';
import { updateVersionHeaderParam } from './utils/updateVersionHeaderParam';

import logger from './logger';

function logRequest (ctx: HookContext): void {
  const { path, method, id, data } = ctx;
  logger.info(`${path}#${method}${id ? ` id: ${id}` : ''}${data ? ` data: ${JSON.stringify(data)}}` : ''}`);
}

function handleVersion (ctx: HookContext): void {
  let { params } = ctx;
  if (params.headers?.version) {
    if (!valid(params.headers.version)) {
      logger.error(`Request made with a version header not in valid semver syntax, ${params.headers.version}`);
      throw new BadRequest(`Request made with a version header not in valid semver syntax, ${params.headers.version}`);
    }
  } else {
    params = updateVersionHeaderParam(params, '2.0.0'); // default version
  }

  ctx.params = params;

  logger.info(`Request made with version ${params.headers?.version}`);
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
  const { name, code, message, stack } = error;
  const rawInfo = pick(ctx, ['params', 'id', 'data']);
  const info = { ...rawInfo, stack };

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
    all: [logRequest, handleVersion],
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
