import { Params, ServiceAddons } from '@feathersjs/feathers';
import { GeneralError } from '@feathersjs/errors';
import axios from 'axios';

import { Application } from '../declarations';
import { config } from '../config';
import { SuccessResponse } from '../types';

interface EmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
}

export class EmailService {
  private app!: Application;

  async create (data: EmailOptions, params: Params): Promise<SuccessResponse> {
    const verifierService = this.app.service('verifier');
    const [verifier] = await verifierService.find(params);

    try {
      const url = `${config.VERIFIER_URL}/api/sendEmail`;

      // Needed to roll over the old attribute value that wasn't storing the Bearer as part of the token. Ought to remove once the roll over is complete. Figured simple to enough to just handle in app code.
      const authToken = verifier.authToken.startsWith('Bearer ') ? verifier.authToken : `Bearer ${verifier.authToken}`;
      const headers = { Authorization: `${authToken}`, version: params?.headers?.version }; // headers ought to be always defined thanks to the pre-create hook

      const response = await axios.post(url, data, { headers });
      return response.data;
    } catch (e) {
      throw new GeneralError(`Error sending email. ${e}`);
    }
  }

  setup (app: Application): void {
    this.app = app;
  }
}

declare module '../declarations' {
  interface ServiceTypes {
    email: EmailService & ServiceAddons<EmailService>;
  }
}

export default function (app: Application): void {
  app.use('/email', new EmailService());
}
