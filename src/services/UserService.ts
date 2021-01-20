import { HookContext, ServiceAddons } from '@feathersjs/feathers';
import createService, { MikroOrmService } from 'feathers-mikro-orm';

import { Application } from '../declarations';
import { User } from '../entities/User';

declare module '../declarations' {
  interface ServiceTypes {
    user: MikroOrmService & ServiceAddons<MikroOrmService>
  }
}

export async function generateUsername (ctx: HookContext): Promise<HookContext> {
  const usernameService = ctx.app.service('username');
  const { username } = await usernameService.create({});

  return {
    ...ctx,
    data: {
      ...ctx.data,
      name: username
    }
  };
}

const hooks = {
  before: {
    create: generateUsername
  }
};

export default function (app: Application): void {
  if (!app.mikro) {
    throw new Error('error configuring UserService, app.mikro is not properly initialized');
  }

  const repository = app.mikro.userRepository;

  if (!repository) {
    throw new Error('error configuring UserService, repository is not properly initialized');
  }

  const userService = createService({
    repository,
    Entity: User,
    name: 'User'
  });

  app.use('/user', userService);
  const service = app.service('user');
  service.hooks(hooks);
}
