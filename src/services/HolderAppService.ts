import { ServiceAddons, HookContext } from '@feathersjs/feathers';
import createService, { MikroOrmService } from 'feathers-mikro-orm';
import axios from 'axios';

import { Application } from '../declarations';
import { HolderApp } from '../entities/HolderApp';
import { config } from '../config';

declare module '../declarations' {
  interface ServiceTypes {
    holderApp: MikroOrmService & ServiceAddons<MikroOrmService>;
  }
}

export async function registerHolderApp (ctx: HookContext): Promise<HookContext> {
  const { data } = ctx;

  const companyService = ctx.app.service('company');
  const company = await companyService.get(data.companyUuid);

  const url = `${config.SAAS_URL}/holderApp`;
  const saasHolderAppOptions = {
    name: data.name,
    uriScheme: data.uriScheme,
    customerUuid: company.unumIdCustomerUuid,
  };

  const headers = { Authorization: `Bearer ${data.apiKey}` };

  const response = await axios.post(url, saasHolderAppOptions, { headers });

  return {
    ...ctx,
    data: {
      name: data.name,
      uriScheme: data.uriScheme,
      company,
      apiKey: data.apiKey,
      uuid: response.data.uuid
    }
  };
}

const hooks = {
  before: {
    create: [registerHolderApp]
  }
};

export default function (app: Application): void {
  if (!app.mikro) {
    throw new Error('error configuring HolderAppService, app.mikro is not properly initialized');
  }

  const repository = app.mikro.holderAppRepository;

  if (!repository) {
    throw new Error('error configuring HolderAppService, repository is not properly initialized');
  }

  const holderAppService = createService({
    repository,
    Entity: HolderApp,
    name: 'HolderApp'
  });

  app.use('/holderApp', holderAppService);
  const service = app.service('holderApp');
  service.hooks(hooks);
}
