import { ServiceAddons } from '@feathersjs/feathers';
import axios from 'axios';

import { Application } from '../declarations';
import { config } from '../config';

interface RequestOptions {
  companyUuid: string;
  verifierUuid: string;
  issuerUuid: string;
  credentialTypes: string[];
}

export class PresentationRequestService {
  private app!: Application;

  async create (data: RequestOptions): Promise<unknown> {
    const issuerService = this.app.service('issuer');
    const verifierService = this.app.service('verifier');

    const issuer = await issuerService.get(data.issuerUuid);
    const verifier = await verifierService.get(data.verifierUuid);

    const presentationUrl = `${config.BASE_URL}/presentation?verifier=${verifier.uuid}`;
    const options = {
      verifier: {
        name: verifier.name,
        did: verifier.did,
        url: presentationUrl
      },
      credentialRequests: data.credentialTypes.map(credentialType => ({
        type: credentialType,
        required: true,
        issuers: [{
          did: issuer.did,
          name: issuer.name,
          required: true
        }]
      })),
      eccPrivateKey: verifier.privateKey
    };

    const url = `${config.VERIFIER_URL}/api/sendRequest`;
    const headers = { Authorization: `Bearer ${verifier.authToken}` };

    const response = await axios.post(url, options, { headers });

    const authTokenResponse = response.headers['x-auth-token'];

    if (authTokenResponse !== verifier.authToken) {
      await verifierService.patch(data.verifierUuid, { authToken: authTokenResponse });
    }

    return response.data;
  }

  setup (app: Application): void {
    this.app = app;
  }
}

declare module '../declarations' {
  interface ServiceTypes {
    presentationRequest: PresentationRequestService & ServiceAddons<PresentationRequestService>
  }
}

export default function (app: Application): void {
  app.use('/presentationRequest', new PresentationRequestService());
}
