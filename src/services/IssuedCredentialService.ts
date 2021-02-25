import { HookContext, ServiceAddons } from '@feathersjs/feathers';
import createService, { MikroOrmService } from 'feathers-mikro-orm';
import axios from 'axios';

import { Application } from '../declarations';
import { IssuedCredential } from '../entities/IssuedCredential';
import { config } from '../config';

declare module '../declarations' {
  interface ServiceTypes {
    credential: MikroOrmService & ServiceAddons<MikroOrmService>
  }
}

export async function issueCredential (ctx: HookContext): Promise<HookContext> {
  const { claims, issuerUuid, userUuid, type, expirationDate } = ctx.data;

  const issuerService = ctx.app.service('issuer');
  const userService = ctx.app.service('user');

  const issuer = await issuerService.get(issuerUuid);

  const user = await userService.get(userUuid);

  const options = {
    credentialSubject: {
      id: user.did,
      ...claims
    },
    issuer: issuer.did,
    type: [type],
    expirationDate,
    eccPrivateKey: issuer.privateKey
  };

  const url = `${config.ISSUER_URL}/api/issueCredential`;

  // Needed to roll over the old attribute value that wasn't storing the Bearer as part of the token. Ought to remove once the roll over is complete. Figured simple to enough to just handle in app code.
  const authToken = issuer.authToken.startsWith('Bearer ') ? issuer.authToken : `Bearer ${issuer.authToken}`;
  const headers = { Authorization: `${authToken}` };

  const response = await axios.post(url, options, { headers });

  const authTokenResponse = response.headers['x-auth-token'];

  if (authTokenResponse !== issuer.authToken) {
    await issuerService.patch(issuerUuid, { authToken: authTokenResponse });
  }

  return {
    ...ctx,
    data: {
      userUuid,
      issuerUuid,
      credential: response.data
    }
  };
}

const hooks = {
  before: {
    create: issueCredential
  }
};

export default function (app: Application): void {
  if (!app.mikro) {
    throw new Error('error configuring IssuedCredentialService, app.mikro is not properly initialized');
  }

  const repository = app.mikro.issuedCredentialRepository;

  if (!repository) {
    throw new Error('error configuring IssuedCredentialService, repository is not properly initialized');
  }

  const issuedCredentialService = createService({
    Entity: IssuedCredential,
    repository,
    name: 'IssuedCredential'
  });

  app.use('/credential', issuedCredentialService);
  const service = app.service('credential');
  service.hooks(hooks);
}
