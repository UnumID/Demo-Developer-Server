import { Application } from '../declarations';
import company from './CompanyService';
import issuer from './IssuerService';
import user from './UserService';
import issuedCredential from './IssuedCredentialService';
import verifier from './VerifierService';
import presentationRequest from './PresentationRequestService';
import presentationWebsocket from './PresentationWebsocketService';
import presentation from './PresentationService';
import presentationV2 from './PresentationServiceV2';
import sharedCredential from './SharedCredentialService';
import holderApp from './HolderAppService';
import username from './UsernameService';
import email from './EmailService';
import sms from './SmsService';
import credentialStatus from './CredentialStatusService';

export default function (app: Application): void {
  app.configure(company);
  app.configure(issuer);
  app.configure(user);
  app.configure(issuedCredential);
  app.configure(verifier);
  app.configure(presentationRequest);
  app.configure(presentationWebsocket);
  app.configure(presentation);
  app.configure(presentationV2);
  app.configure(sharedCredential);
  app.configure(holderApp);
  app.configure(username);
  app.configure(email);
  app.configure(sms);
  app.configure(credentialStatus);
}
