import { ServiceAddons, HookContext } from '@feathersjs/feathers';
import createService, { MikroOrmService } from 'feathers-mikro-orm';
import axios from 'axios';

import { Application } from '../declarations';
import { Issuer } from '../entities/Issuer';
import { config } from '../config';
import { GeneralError } from '@feathersjs/errors';

declare module '../declarations' {
  interface ServiceTypes {
    issuer: MikroOrmService & ServiceAddons<MikroOrmService>
  }
}

export async function registerIssuer (ctx: HookContext): Promise<HookContext> {
  const { data, params } = ctx;

  const companyService = ctx.app.service('company');

  const company = await companyService.get(data.companyUuid, params);

  const url = `${config.ISSUER_URL}/api/register`;
  const headers = { version: params.headers?.version }; // ought to be defined via the global before hook
  const issuerOptions = {
    ...data,
    apiKey: data.issuerApiKey,
    customerUuid: company.unumIdCustomerUuid
  };

  try {
    const response = await axios.post(url, issuerOptions, { headers });

    return {
      ...ctx,
      data: {
        name: response.data.name,
        privateKey: response.data.keys.signing.privateKey,
        did: response.data.did,
        authToken: response.headers['x-auth-token'],
        companyUuid: data.companyUuid
      }
    };
  } catch (e) {
    throw new GeneralError(`Error registering issuer. ${e}`);
  }
}

const hooks = {
  before: {
    create: registerIssuer
  }
};

export default function (app: Application): void {
  if (!app.mikro) {
    throw new Error('error configuring IssuerService, app.mikro is not properly initialized');
  }

  const repository = app.mikro.issuerRepository;

  if (!repository) {
    throw new Error('error configuring IssuerService, repository is not properly initialized');
  }

  const issuerService = createService({
    repository,
    Entity: Issuer,
    name: 'Issuer'
  });

  app.use('/issuer', issuerService);
  const service = app.service('issuer');
  service.hooks(hooks);
}
