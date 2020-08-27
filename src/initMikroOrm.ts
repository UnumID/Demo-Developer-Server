import {
  MikroORM,
  RequestContext
} from 'mikro-orm';

import { Application, Mikro } from './declarations';
import config from './mikro-orm.config';

export const mikro = {} as Mikro;

export async function initMikroOrm (app: Application): Promise<void> {
  mikro.orm = await MikroORM.init(config);

  mikro.em = mikro.orm.em;

  app.use((req, res, next) => RequestContext.create(mikro.orm.em, next));
  app.mikro = mikro; // eslint-disable-line no-param-reassign
}
