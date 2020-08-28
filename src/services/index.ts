import { Application } from '../declarations';
import company from './CompanyService';
import issuer from './IssuerService';
import user from './UserService';

export default function (app: Application): void {
  app.configure(company);
  app.configure(issuer);
  app.configure(user);
}
