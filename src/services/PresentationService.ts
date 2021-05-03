import { HookContext, Params, ServiceAddons } from '@feathersjs/feathers';
import { BadRequest } from '@feathersjs/errors';
import axios from 'axios';
import { Channel } from '@feathersjs/transport-commons/lib/channels/channel/base';

import { Application } from '../declarations';
import { config } from '../config';
import logger from '../logger';
import { isArrayNotEmpty } from '../utils/isArrayEmpty';
import { valid } from 'semver';

import { EncryptedPresentation, NoPresentation, PresentationReceiptInfo } from '@unumid/types-deprecated';
import { DecryptedPresentation, extractCredentialInfo, Presentation, CredentialInfo } from '@unumid/server-sdk-deprecated';
import { DemoNoPresentationDto, DemoPresentationDto, VerificationResponse as VerificationResponseDeprecated } from '@unumid/demo-types-deprecated';
import { WithVersion } from '@unumid/demo-types';
import { VerificationResponse } from '@unumid/types';

import { lt } from 'lodash';

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
export class PresentationService {
  private app!: Application;

  async create (presentation: EncryptedPresentation, params: Params): Promise<VerificationResponse | VerificationResponseDeprecated> {
    const { presentationRequestInfo, encryptedPresentation } = presentation;
    const presentationRequestUuid = presentationRequestInfo.presentationRequest.uuid;

    const presentationRequestService = this.app.service('presentationRequest');
    const presentationWebsocketService = this.app.service('presentationWebsocket');
    const presentationServiceV2 = this.app.service('presentationV2');
    const presentationRequest = await presentationRequestService.get(presentationRequestUuid);
    const verifier = await presentationRequest._verifier.init();
    const verifierService = this.app.service('verifier');
    const version = params.headers?.version; // ought to be defined via the global before hook

    // verify presentation
    const url = `${config.VERIFIER_URL}/api/verifyPresentation`;

    // Needed to roll over the old attribute value that wasn't storing the Bearer as part of the token. Ought to remove once the roll over is complete. Figured simple to enough to just handle in app code.
    const authToken = verifier.authToken.startsWith('Bearer ') ? verifier.authToken : `Bearer ${verifier.authToken}`;
    // const headers = { Authorization: `${authToken}`, version: presentation.version };
    const headers = { Authorization: `${authToken}`, version };

    if (lt(version, '2.0.0')) {
    // forward request to verifier
      const response = await axios.post(url, { encryptedPresentation, verifier: verifier.did, encryptionPrivateKey: verifier.encryptionPrivateKey }, { headers });
      const result: DecryptedPresentation = response.data;

      logger.info(`response from verifier app ${result}`);

      // update the verifier's auth token if it was reissued
      const authTokenResponse = response.headers['x-auth-token'];
      if (authTokenResponse !== verifier.authToken) {
        await verifierService.patch(verifier.uuid, { authToken: authTokenResponse });
      }

      // return early if the presentation could not be verified
      if (!result.isVerified) {
        throw new BadRequest(`Verification failed: ${result.message}`);
      }
      const decryptedPresentation: Presentation | NoPresentation = result.presentation;

      if (result.type === 'VerifiablePresentation' && isArrayNotEmpty((decryptedPresentation as Presentation).verifiableCredentials)) {
      // save shared credentials
        const sharedCredentialService = this.app.service('sharedCredential');
        const issuerService = this.app.service('issuer');
        const userService = this.app.service('user');

        for (const credential of (decryptedPresentation as Presentation).verifiableCredentials) {
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

      // Handle passing to the presentation websokcet service for web client consuming the plaintext presentation, which should not be returned to UnumID's saas.
      if (result.type === 'VerifiablePresentation') {
        const demoVerification: DemoPresentationDto = {
          isVerified: true,
          presentation: decryptedPresentation as Presentation,
          uuid: '', // unused in this demo
          createdAt: new Date(), // unused in this demo
          updatedAt: new Date() // unused in this demo
        };
        await presentationWebsocketService.create(demoVerification, params);
      } else {
        const demoVerification: DemoNoPresentationDto = {
          isVerified: true,
          noPresentation: decryptedPresentation as NoPresentation,
          uuid: '', // unused in this demo
          createdAt: new Date(), // unused in this demo
          updatedAt: new Date() // unused in this demo
        };
        await presentationWebsocketService.create(demoVerification, params);
      }

      // extract the relevant credential info to send back to UnumID's SaaS for analytics.
      const credentialInfo: CredentialInfo = extractCredentialInfo(decryptedPresentation as Presentation);

      const presentationReceiptInfo: PresentationReceiptInfo = {
        subjectDid: credentialInfo.subjectDid,
        credentialTypes: credentialInfo.credentialTypes,
        verifierDid: verifier.did,
        holderApp: presentationRequest.holderApp.uuid,
        issuers: result.type === 'VerifiablePresentation' ? presentationRequest.issuers : undefined
      };

      return { isVerified: true, type: result.type, presentationReceiptInfo, presentationRequestUuid: presentationRequestInfo.presentationRequest.uuid };
    } else {
      // request was made with version header 2.0.0+, use the v2 service
      // const newParams = {
      //   ...params,
      //   headers: { ...params?.headers, version: presentation.version }
      // };

      // return await presentationServiceV2.create(presentation, newParams);
      return await presentationServiceV2.create(presentation, params);
    }
  }

  setup (app: Application): void {
    this.app = app;
  }
}

// function handleVersion (ctx: HookContext): void {
//   let { params, data } = ctx;
//   if (params.headers?.version) {
//     if (!valid(params.headers.version)) {
//       logger.error(`Request made with a version header not in valid semver syntax, ${params.headers.version}`);
//       throw new BadRequest(`Request made with a version header not in valid semver syntax, ${params.headers.version}`);
//     }
//     data.version = params.headers.version; // adding to input data
//   } else {
//     // Actually going to allow request without version headers for backwards compatibility
//     // logger.error('Request made without a version header.');
//     // throw new BadRequest('Version header is required.');
//     if (data) {
//       data.version = '1.0.0'; // base version
//     } else {
//       data = { version: '1.0.0' };
//     }
//   }

//   logger.info(`Request made with version ${data.version}`);
// }

// export const hooks = {
//   before: {
//     create: [
//       handleVersion
//     ]
//   }
// };

declare module '../declarations' {
  interface ServiceTypes {
    presentation: PresentationService & ServiceAddons<PresentationService>
  }
}

export default function (app: Application): void {
  app.use('/presentation', new PresentationService());
  const service = app.service('presentation');
  service.publish(publisher(app));
}
