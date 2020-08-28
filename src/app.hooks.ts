// Application hooks that run for every service
import { HookContext } from '@feathersjs/feathers';
import { pick } from 'lodash';

export default {
  before: {
    all: [],
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
    all: [(ctx: HookContext): void => {
      const { path, method, error } = ctx;
      const { name, code, message } = error;
      const info = pick(ctx, ['path', 'method', 'params', 'id', 'data']);
      console.warn(`Error in ${path}#${method}: name=${name} code=${code} message=${message}`, info);
    }],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
