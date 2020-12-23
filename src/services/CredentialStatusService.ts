import { ServiceAddons } from '@feathersjs/feathers';
import { GeneralError } from '@feathersjs/errors';
import axios from 'axios';

import { Application } from '../declarations';
import { config } from '../config';
import { SuccessResponse } from '../types';

export class CredentialStatusService {
  private app!: Application;

  async patch (credentialId: string): Promise<SuccessResponse> {
    const issuerService = this.app.service('issuer');
    const [issuer] = await issuerService.find();

    try {
      const url = `${config.ISSUER_URL}/api/revokeCredentials`;
      const headers = { Authorization: `Bearer ${issuer.authToken}` };
      const response = await axios.post(url, { credentialId }, { headers });
      return response.data;
    } catch (e) {
      throw new GeneralError('Error updating credentialStatus');
    }
  }

  setup (app: Application): void {
    this.app = app;
  }
}

declare module '../declarations' {
  interface ServiceTypes {
    credentialStatus: CredentialStatusService & ServiceAddons<CredentialStatusService>;
  }
}

export default function (app: Application): void {
  app.use('/credentialStatus', new CredentialStatusService());
}
