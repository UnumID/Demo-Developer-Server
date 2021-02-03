import { ServiceAddons } from '@feathersjs/feathers';
import { BadRequest } from '@feathersjs/errors';
import axios from 'axios';

import { Application } from '../declarations';
import { config } from '../config';
import { IssuerInfoMap, EncryptedData } from '../types';
import logger from '../logger';
import { Channel } from '@feathersjs/transport-commons/lib/channels/channel/base';
import { isArrayNotEmpty } from '../utils/isArrayEmpty';

export interface PresentationReceiptInfo {
  subjectDid: string;
  verifierDid: string;
  holderApp: string;
  credentialTypes?: [string];
  issuers?: IssuerInfoMap;
}

export interface VerificationResponse {
  isVerified: boolean;
  type: 'VerifiablePresentation' | 'NoPresentation';
  presentationReceiptInfo: PresentationReceiptInfo;
}

export interface EncryptedPresentation {
  presentationRequestUuid: string;
  encryptedPresentation: EncryptedData;
}

export function publisher (app: Application) {
  return async function actualPublisher (response: any): Promise<Channel> {
    console.log('response', response);
    const presentationRequestService = app.service('presentationRequest');
    const presentationRequest = await presentationRequestService.get(response.data.presentationRequestUuid);
    const { userUuid } = presentationRequest.metadata;
    return app.channel(userUuid);
  };
}

/**
 * This service handles encrypted presentations from the saas where v1 handle plain text presentation from the holder sdk.
 */
export class PresentationServiceV2 {
  private app!: Application;

  async create (presentation: EncryptedPresentation): Promise<VerificationResponse> {
    const { presentationRequestUuid, encryptedPresentation } = presentation;

    const presentationRequestService = this.app.service('presentationRequest');
    const presentationRequest = await presentationRequestService.get(presentationRequestUuid);
    const verifier = await presentationRequest._verifier.init();
    const verifierService = this.app.service('verifier');

    // verify presentation
    const url = `${config.VERIFIER_URL}/api/verifyEncryptedPresentation`;
    // const url = `${config.VERIFIER_URL}/api/verifyPresentation`;
    const headers = { Authorization: `Bearer ${verifier.authToken}` };

    // forward request to verifier
    const response = await axios.post(url, { encryptedPresentation, verifier: verifier.did, encryptionPrivateKey: verifier.encryptionPrivateKey }, { headers });

    logger.info('response from verifier app', response.data);

    // update the verifier's auth token if it was reissued
    const authTokenResponse = response.headers['x-auth-token'];
    if (authTokenResponse !== verifier.authToken) {
      await verifierService.patch(verifier.uuid, { authToken: authTokenResponse });
    }

    // return early if the presentation could not be verified
    if (!response.data.isVerified) {
      throw new BadRequest('Verification failed');
    }

    if (isArrayNotEmpty(response.data.type) && response.data.type.includes('PresentationVerified')) {
      // save shared credentials
      const sharedCredentialService = this.app.service('sharedCredential');
      const issuerService = this.app.service('issuer');
      const userService = this.app.service('user');

      for (const credential of response.data.credentials) {
        // get saved issuer and user by their dids
        // note that the saved dids will not include key identifier fragments, which may be included in the credential
        const issuer = await issuerService.get(null, { where: { did: credential.issuer.split('#')[0] } });
        const user = await userService.get(null, { where: { did: credential.credentialSubject.id.split('#')[0] } });

        const options = {
          verifierUuid: verifier.uuid,
          issuerUuid: issuer.uuid,
          userUuid: user.uuid,
          credential
        };

        await sharedCredentialService.create(options);
      }
    }

    const presentationReceiptInfo: PresentationReceiptInfo = {
      subjectDid: response.data.subject,
      credentialTypes: response.data.credentialTypes,
      verifierDid: verifier.did,
      holderApp: presentationRequest.holderApp.uuid,
      issuers: response.data.type && response.data.type.includes('PresentationVerified') ? presentationRequest.issuers : undefined
    };

    return { isVerified: true, type: response.data.type, presentationReceiptInfo };
  }

  setup (app: Application): void {
    this.app = app;
  }
}

declare module '../declarations' {
  interface ServiceTypes {
    presentationV2: PresentationServiceV2 & ServiceAddons<PresentationServiceV2>
  }
}

export default function (app: Application): void {
  app.use('/presentationV2', new PresentationServiceV2());
  const service = app.service('presentationV2');
  service.publish(publisher(app));
}
