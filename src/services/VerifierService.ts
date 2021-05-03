import { ServiceAddons, HookContext } from '@feathersjs/feathers';
import createService, { MikroOrmService } from 'feathers-mikro-orm';
import axios from 'axios';

import { Application } from '../declarations';
import { Verifier } from '../entities/Verifier';
import { config } from '../config';

declare module '../declarations' {
  interface ServiceTypes {
    verifier: MikroOrmService & ServiceAddons<MikroOrmService>
  }
}

export async function registerVerifier (ctx: HookContext): Promise<HookContext> {
  const { data, params } = ctx;

  const definedVerifierUrl = data.url;
  const companyService = ctx.app.service('company');

  const company = await companyService.get(data.companyUuid);

  const verifierUrl = `${config.VERIFIER_URL}/api/register`;
  const headers = { version: params.headers?.version }; // ought to be defined via the global before hook
  const verifierOptions = {
    ...data,
    apiKey: data.verifierApiKey,
    customerUuid: company.unumIdCustomerUuid,
    url: definedVerifierUrl
  };

  const response = await axios.post(verifierUrl, verifierOptions, { headers });

  return {
    ...ctx,
    data: {
      name: response.data.name,
      privateKey: response.data.keys.signing.privateKey,
      encryptionPrivateKey: response.data.keys.encryption.privateKey,
      did: response.data.did,
      authToken: response.headers['x-auth-token'],
      companyUuid: data.companyUuid
    }
  };
}

const hooks = {
  before: {
    create: registerVerifier
  }
};

export default function (app: Application): void {
  if (!app.mikro) {
    throw new Error('error configuring VerifierService, app.mikro is not properly initialized');
  }

  const repository = app.mikro.verifierRepository;

  if (!repository) {
    throw new Error('error configuring VerifierService, repository is not properly initialized');
  }

  const companyService = createService({
    repository,
    Entity: Verifier,
    name: 'Verifier'
  });

  app.use('/verifier', companyService);
  const service = app.service('verifier');
  service.hooks(hooks);
}
