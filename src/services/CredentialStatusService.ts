import { ServiceAddons } from '@feathersjs/feathers';
import { GeneralError } from '@feathersjs/errors';
import axios from 'axios';

import { Application } from '../declarations';
import { config } from '../config';
import { SuccessResponse } from '../types';

interface CredentialStatusPatchOptions {
  issuerUuid: string;
  status: 'valid' | 'revoked'
}

export class CredentialStatusService {
  private app!: Application;

  async patch (credentialId: string, data: CredentialStatusPatchOptions): Promise<SuccessResponse> {
    const issuerService = this.app.service('issuer');
    const issuer = await issuerService.get(data.issuerUuid);

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
