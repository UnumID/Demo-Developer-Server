import { ServiceAddons } from '@feathersjs/feathers';
import createService, { MikroOrmService } from 'feathers-mikro-orm';

import { Application } from '../declarations';
import { Company } from '../entities/Company';

declare module '../declarations' {
  interface ServiceTypes {
    company: MikroOrmService & ServiceAddons<MikroOrmService>
  }
}

export default function (app: Application): void {
  if (!app.mikro) {
    throw new Error('error configuring CompanyService, app.mikro is not properly initialized');
  }

  const repository = app.mikro.companyRepository;

  if (!repository) {
    throw new Error('error configuring CompanyService, repository is not properly initialized');
  }

  const companyService = createService({
    repository,
    Entity: Company,
    name: 'Company'
  });

  app.use('/company', companyService);
}
