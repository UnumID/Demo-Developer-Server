import { ServiceAddons } from '@feathersjs/feathers';
import { BadRequest } from '@feathersjs/errors';
import axios from 'axios';

import { Application } from '../declarations';
import { config } from '../config';
import { PresentationOrNoPresentation, Presentation } from '../types';
import logger from '../logger';

export interface VerificationResponse {
  isVerified: boolean;
  type: 'VerifiablePresentation' | 'NoPresentation'
}

export function isPresentation (presentation: PresentationOrNoPresentation): presentation is Presentation {
  return presentation.type[0] === 'VerifiablePresentation';
}

export class PresentationService {
  private app!: Application;

  async create (presentation: PresentationOrNoPresentation): Promise<VerificationResponse> {
    const { presentationRequestUuid } = presentation;

    const presentationRequestService = this.app.service('presentationRequest');
    const presentationRequest = await presentationRequestService.get(presentationRequestUuid);
    const verifier = await presentationRequest._verifier.init();
    const verifierService = this.app.service('verifier');

    // verify presentation
    const url = `${config.VERIFIER_URL}/api/verifyPresentation`;
    const headers = { Authorization: `Bearer ${verifier.authToken}` };

    // for now, assume all NoPresentations are valid
    // TODO: remove or replace with actual implementation once Verifier-Server-App is updated
    // to handle NoPresentations (https://trello.com/c/DbvobNVo/612-handle-nopresentations-part-2)
    if (!isPresentation(presentation)) {
      logger.info('Received NoPresentation', presentation);

      const noPresentationUrl = `${config.VERIFIER_URL}/api/verifyNoPresentation`;

      const response = await axios.post(noPresentationUrl, presentation, { headers });

      if (!response.data.isVerified) {
        throw new BadRequest('Verification failed.');
      }
      return { isVerified: response.data.isVerified, type: 'NoPresentation' };
    }

    const response = await axios.post(url, { presentation, verifier: verifier.did }, { headers });

    logger.info('response from verifier app', response.data);

    // update the verifier's auth token if it was reissued
    const authTokenResponse = response.headers['x-auth-token'];
    if (authTokenResponse !== verifier.authToken) {
      await verifierService.patch(verifier.uuid, { authToken: authTokenResponse });
    }

    // return early if the presentation could not be verified
    if (!response.data.verifiedStatus) {
      // return { isVerified: false, type: 'VerifiablePresentation' };
      throw new BadRequest('Verification failed');
    }

    // save shared credentials
    const sharedCredentialService = this.app.service('sharedCredential');
    const issuerService = this.app.service('issuer');
    const userService = this.app.service('user');

    for (const credential of presentation.verifiableCredential) {
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

    return { isVerified: true, type: 'VerifiablePresentation' };
  }

  setup (app: Application): void {
    this.app = app;
  }
}

declare module '../declarations' {
  interface ServiceTypes {
    presentation: PresentationService & ServiceAddons<PresentationService>
  }
}

export default function (app: Application): void {
  app.use('/presentation', new PresentationService());
}
