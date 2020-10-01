import { ServiceAddons, Params } from '@feathersjs/feathers';
import { BadRequest } from '@feathersjs/errors';
import axios from 'axios';

import { Application } from '../declarations';
import { config } from '../config';
import { Presentation } from '../types';

export interface VerificationResponse {
  isVerified: boolean;
}

export class PresentationService {
  private app!: Application;

  async create (presentation: Presentation, params: Params): Promise<VerificationResponse> {
    const verifierUuid = params.query?.verifier;

    if (!verifierUuid) {
      throw new BadRequest('Verifier query param is required.');
    }

    const verifierService = this.app.service('verifier');
    const verifier = await verifierService.get(verifierUuid);

    // verify presentation
    const url = `${config.VERIFIER_URL}/api/verifyPresentation`;
    const headers = { Authorization: `Bearer ${verifier.authToken}` };

    const response = await axios.post(url, presentation, { headers });

    // update the verifier's auth token if it was reissued
    const authTokenResponse = response.headers['x-auth-token'];
    if (authTokenResponse !== verifier.authToken) {
      await verifierService.patch(verifierUuid, { authToken: authTokenResponse });
    }

    // return early if the presentation could not be verified
    if (!response.data.verifiedStatus) {
      return { isVerified: false };
    }

    // TODO: save shared credentials

    return { isVerified: true };
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
