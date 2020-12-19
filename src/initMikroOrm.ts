import {
  MikroORM,
  RequestContext
} from 'mikro-orm';

import { Application, Mikro } from './declarations';
import config from './mikro-orm.config';
import { Company } from './entities/Company';
import { Issuer } from './entities/Issuer';
import { User } from './entities/User';
import { IssuedCredential } from './entities/IssuedCredential';
import { Verifier } from './entities/Verifier';
import { SharedCredential } from './entities/SharedCredential';
import { PresentationRequest } from './entities/PresentationRequest';
import { HolderApp } from './entities/HolderApp';
import { Username } from './entities/Username';

export const mikro = {} as Mikro;

export async function initMikroOrm (app: Application): Promise<void> {
  mikro.orm = await MikroORM.init(config);

  mikro.em = mikro.orm.em;
  mikro.companyRepository = mikro.em.getRepository(Company);
  mikro.issuerRepository = mikro.em.getRepository(Issuer);
  mikro.userRepository = mikro.em.getRepository(User);
  mikro.issuedCredentialRepository = mikro.em.getRepository(IssuedCredential);
  mikro.verifierRepository = mikro.em.getRepository(Verifier);
  mikro.sharedCredentialRepository = mikro.em.getRepository(SharedCredential);
  mikro.presentationRequestRepository = mikro.em.getRepository(PresentationRequest);
  mikro.holderAppRepository = mikro.em.getRepository(HolderApp);
  mikro.usernameRepository = mikro.em.getRepository(Username);

  app.use((req, res, next) => RequestContext.create(mikro.orm.em, next));
  app.mikro = mikro; // eslint-disable-line no-param-reassign
}
