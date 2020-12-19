import { Application } from '../declarations';
import company from './CompanyService';
import issuer from './IssuerService';
import user from './UserService';
import issuedCredential from './IssuedCredentialService';
import verifier from './VerifierService';
import presentationRequest from './PresentationRequestService';
import presentation from './PresentationService';
import sharedCredential from './SharedCredentialService';
import holderApp from './HolderAppService';
import username from './UsernameService';

export default function (app: Application): void {
  app.configure(company);
  app.configure(issuer);
  app.configure(user);
  app.configure(issuedCredential);
  app.configure(verifier);
  app.configure(presentationRequest);
  app.configure(presentation);
  app.configure(sharedCredential);
  app.configure(holderApp);
  app.configure(username);
}
