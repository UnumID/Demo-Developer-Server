import { ServiceAddons } from '@feathersjs/feathers';
import createService, { MikroOrmService } from 'feathers-mikro-orm';

import { Application } from '../declarations';
import { SharedCredential } from '../entities/SharedCredential';

declare module '../declarations' {
  interface ServiceTypes {
    sharedCredential: MikroOrmService & ServiceAddons<MikroOrmService>
  }
}

export default function (app: Application): void {
  if (!app.mikro) {
    throw new Error('error configuring SharedCredentialService, app.mikro is not properly initialized');
  }

  const repository = app.mikro.sharedCredentialRepository;

  if (!repository) {
    throw new Error('error configuring SharedCredentialService, repository is not properly initialized');
  }

  const sharedCredentialService = createService({
    Entity: SharedCredential,
    repository,
    name: 'SharedCredential'
  });

  app.use('/sharedCredential', sharedCredentialService);
}
