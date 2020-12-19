import { ServiceAddons, HookContext } from '@feathersjs/feathers';
import createService, { MikroOrmService } from 'feathers-mikro-orm';
import faker from 'faker';

import { Application } from '../declarations';
import { Username } from '../entities/Username';

declare module '../declarations' {
  interface ServiceTypes {
    username: MikroOrmService & ServiceAddons<MikroOrmService>;
  }
}

export async function generateUniqueUsername (usernameService: MikroOrmService): Promise<string> {
  const username = faker.fake('{{random.word}}-{{random.word}}-{{random.number(999)}}');

  const [existingUsername] = await usernameService.find({ where: { username } });

  if (existingUsername) {
    return generateUniqueUsername(usernameService);
  } else {
    return username;
  }
}

export async function generateUsernameHook (ctx: HookContext): Promise<HookContext> {
  const username = await generateUniqueUsername(ctx.app.service('username')) as string;
  return {
    ...ctx,
    data: {
      ...ctx.data,
      username
    }
  };
}

const hooks = {
  before: {
    create: generateUsernameHook
  }
};

export default function (app: Application): void {
  if (!app.mikro) {
    throw new Error('error configuring UsernameService, app.mikro is not properly initialized');
  }

  const repository = app.mikro.usernameRepository;

  if (!repository) {
    throw new Error('error configuring UsernameService, repository is not properly initialized');
  }

  const usernameService = createService({
    repository,
    Entity: Username,
    name: 'Username'
  });

  app.use('/username', usernameService);
  const service = app.service('username');
  service.hooks(hooks);
}
