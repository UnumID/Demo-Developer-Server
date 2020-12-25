import { ServiceAddons, HookContext } from '@feathersjs/feathers';
import axios from 'axios';
import createService, { MikroOrmService } from 'feathers-mikro-orm';

import { Application } from '../declarations';
import { config } from '../config';
import { PresentationRequest } from '../entities/PresentationRequest';

interface RequestOptions {
  companyUuid: string;
  verifierUuid: string;
  issuerUuid: string;
  credentialTypes: string[];
}

export async function sendRequest (ctx: HookContext): Promise<HookContext> {
  const { app, data } = ctx;

  const issuerService = app.service('issuer');
  const verifierService = app.service('verifier');
  const holderAppService = app.service('holderApp');

  const issuer = await issuerService.get(data.issuerUuid);
  const verifier = await verifierService.get(data.verifierUuid);
  const holderApp = await holderAppService.get(data.holderAppUuid);

  const options = {
    verifier: verifier.did,
    credentialRequests: data.credentialTypes.map((credentialType: string) => ({
      type: credentialType,
      required: true,
      issuers: [issuer.did]
    })),
    eccPrivateKey: verifier.privateKey,
    holderAppUuid: data.holderAppUuid
  };

  const url = `${config.VERIFIER_URL}/api/sendRequest`;
  const headers = { Authorization: `Bearer ${verifier.authToken}` };

  const response = await axios.post(url, options, { headers });

  const authTokenResponse = response.headers['x-auth-token'];

  if (authTokenResponse !== verifier.authToken) {
    await verifierService.patch(data.verifierUuid, { authToken: authTokenResponse });
  }
  return {
    ...ctx,
    data: {
      ...response.data.presentationRequest,
      verifierInfo: response.data.verifier,
      issuers: response.data.issuers,
      deeplink: response.data.deeplink,
      qrCode: response.data.qrCode,
      verifier,
      holderApp,
      data: response.data
    }
  };
}

declare module '../declarations' {
  interface ServiceTypes {
    presentationRequest: MikroOrmService & ServiceAddons<MikroOrmService>
  }
}

const hooks = {
  before: {
    create: sendRequest
  }
};

export default function (app: Application): void {
  if (!app.mikro) {
    throw new Error('error configuring PresentationRequestService, app.mikro is not properly initialized');
  }

  const repository = app.mikro.presentationRequestRepository;

  if (!repository) {
    throw new Error('error configuring PresentationRequestService, repository is not properly initialized');
  }

  const presentationRequestService = createService({
    repository,
    Entity: PresentationRequest,
    name: 'PresentationRequest'
  });

  app.use('/presentationRequest', presentationRequestService);
  const service = app.service('presentationRequest');
  service.hooks(hooks);
}
