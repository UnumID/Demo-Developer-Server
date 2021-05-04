import { ServiceAddons, HookContext } from '@feathersjs/feathers';
import axios from 'axios';
import createService, { MikroOrmService } from 'feathers-mikro-orm';

import { Application } from '../declarations';
import { config } from '../config';
import { PresentationRequest } from '../entities/PresentationRequest';
import logger from '../logger';
import { handleError } from '../utils/errorHandler';

interface RequestOptions {
  companyUuid: string;
  verifierUuid: string;
  issuerUuid: string;
  credentialTypes: string[];
}

export async function sendRequest (ctx: HookContext): Promise<HookContext> {
  const { app, data, params } = ctx;

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
    holderAppUuid: data.holderAppUuid,
    metadata: {
      userUuid: data.userUuid
    }
  };

  const url = `${config.VERIFIER_URL}/api/sendRequest`;

  // Needed to roll over the old attribute value that wasn't storing the Bearer as part of the token. Ought to remove once the roll over is complete. Figured simple to enough to just handle in app code.
  const authToken = verifier.authToken.startsWith('Bearer ') ? verifier.authToken : `Bearer ${verifier.authToken}`;
  const headers = { Authorization: authToken, version: params?.headers?.version }; // ought to be defined thanks to global hook

  try {
    const response = await axios.post(url, options, { headers });
    // const body: PresentationRequestResponse = response.data;

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
  } catch (e) {
    logger.error('Error sending presentation request', e);
    handleError(e);
    throw e;
  }
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
