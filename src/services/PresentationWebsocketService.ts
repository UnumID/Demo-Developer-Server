import { ServiceAddons } from '@feathersjs/feathers';

import { Application } from '../declarations';
import { PresentationOrNoPresentation, NoPresentation } from '@unumid/types';
import { Channel } from '@feathersjs/transport-commons/lib/channels/channel/base';
import { Presentation } from '@unumid/server-sdk';
import { DemoNoPresentationDto, DemoPresentationDto } from '@unumid/demo-types';

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
    console.log('response', response);
    const presentationRequestService = app.service('presentationRequest');
    const prUuid = (response as DemoPresentationDto).presentation?.presentationRequestUuid || (response as DemoNoPresentationDto).noPresentation?.presentationRequestUuid;
    const presentationRequest = await presentationRequestService.get(prUuid);
    console.log(`response prUuid ${prUuid}`);
    const { userUuid } = presentationRequest.metadata;
    console.log(`response user uuid ${userUuid}`);
    return app.channel(userUuid);
  };
}

export class PresentationWebsocketService {
  private app!: Application;

  async create (verificationResponse: DemoPresentationDto | DemoNoPresentationDto): Promise<DemoPresentationDto | DemoNoPresentationDto> {
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
