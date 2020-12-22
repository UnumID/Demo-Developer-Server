import { ServiceAddons } from '@feathersjs/feathers';
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

  async create (data: EmailOptions): Promise<SuccessResponse> {
    const verifierService = this.app.service('verifier');
    const [verifier] = await verifierService.find();

    try {
      const url = `${config.VERIFIER_URL}/api/sendEmail`;
      const headers = { Authorization: `Bearer ${verifier.authToken}` };
      const response = await axios.post(url, data, { headers });
      return response.data;
    } catch (e) {
      throw new GeneralError('Error sending email.');
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
