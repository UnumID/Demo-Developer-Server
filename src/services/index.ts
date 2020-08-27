import { Application } from '../declarations';
import company from './CompanyService';

export default function (app: Application): void {
  app.configure(company);
}
