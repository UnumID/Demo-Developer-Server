import { Params, ServiceAddons } from '@feathersjs/feathers';

import { Application } from '../declarations';
import { PresentationOrNoPresentation, NoPresentation } from '@unumid/types-deprecated-v1';
import { Channel } from '@feathersjs/transport-commons/lib/channels/channel/base';
import { Presentation } from '@unumid/server-sdk-deprecated-v1';
// import { DemoNoPresentationDto as DemoNoPresentationDtoDeprecatedV1, DemoPresentationDto as DemoPresentationDtoDeprecatedV1 } from '@unumid/demo-types-deprecated-v1';
import { DemoPresentationDto as DemoNoPresentationDtoDeprecatedV2 } from '@unumid/demo-types-deprecated-v2';
import { DemoPresentationDto } from '@unumid/demo-types';
import logger from '../logger';

export interface VerificationPresentationResponse {
  isVerified: boolean;
  type: 'VerifiablePresentation' | 'NoPresentation';
  data: Presentation | NoPresentation;
}

export function isPresentation (presentation: PresentationOrNoPresentation): presentation is Presentation {
  return presentation.type[0] === 'VerifiablePresentation';
}

export function publisher (app: Application) {
  return async function actualPublisher (response: any): Promise<Channel> {
    logger.info(`Presentation websocket publisher input: ${response}`);

    const presentationRequestService = app.service('presentationRequest');
    const presentationRequestId = response.presentation?.presentationRequestId;
    const presentationRequest = await presentationRequestService.get(null, { where: { id: presentationRequestId } });

    logger.info(`Presentation websocket publisher presentationRequestId ${presentationRequestId}`);
    const { userUuid } = presentationRequest.metadata.fields;

    logger.info(`Presentation websocket publishing event for user with uuid ${userUuid}`);
    return app.channel(userUuid);
  };
}

export class PresentationWebsocketService {
  private app!: Application;

  async create (verificationResponse: DemoPresentationDto | DemoNoPresentationDtoDeprecatedV2, params: Params): Promise<DemoNoPresentationDtoDeprecatedV2 | DemoPresentationDto> {
    return verificationResponse;
  }

  setup (app: Application): void {
    this.app = app;
  }
}

declare module '../declarations' {
  interface ServiceTypes {
    presentationWebsocket: PresentationWebsocketService & ServiceAddons<PresentationWebsocketService>
  }
}

export default function (app: Application): void {
  app.use('/presentationWebsocket', new PresentationWebsocketService());
  const service = app.service('presentationWebsocket');
  service.publish(publisher(app));
}
