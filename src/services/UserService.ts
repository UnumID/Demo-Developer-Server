import { ServiceAddons } from '@feathersjs/feathers';
import createService, { MikroOrmService } from 'feathers-mikro-orm';

import { Application } from '../declarations';
import { User } from '../entities/User';

declare module '../declarations' {
  interface ServiceTypes {
    user: MikroOrmService & ServiceAddons<MikroOrmService>
  }
}

export default function (app: Application): void {
  if (!app.mikro) {
    throw new Error('error configuring UserService, app.mikro is not properly initialized');
  }

  const repository = app.mikro.companyRepository;

  if (!repository) {
    throw new Error('error configuring UserService, repository is not properly initialized');
  }

  const userService = createService({
    repository,
    Entity: User,
    name: 'User'
  });

  app.use('/user', userService);
}
