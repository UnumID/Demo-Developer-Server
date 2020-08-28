import { Application } from '../declarations';
import company from './CompanyService';
import issuer from './IssuerService';

export default function (app: Application): void {
  app.configure(company);
  app.configure(issuer);
}
