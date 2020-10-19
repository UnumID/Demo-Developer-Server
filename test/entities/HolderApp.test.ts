import { MikroORM } from 'mikro-orm';
import { v4 as uuidv4 } from 'uuid';

import ormConfig from '../../src/mikro-orm.config';
import { Company } from '../../src/entities/Company';
import { HolderApp, HolderAppEntityOptions } from '../../src/entities/HolderApp';
import { resetDb } from '../resetDb';

describe('HolderApp Entity', () => {
  let options: HolderAppEntityOptions;
  let orm;

  beforeEach(async () => {
    orm = await MikroORM.init(ormConfig);
    const companyRepository = orm.em.getRepository(Company);
    const companyOptions = {
      unumIdApiKey: '3n5jhT2vXDEEXlRj09oI9pP6DmWNXNCghUMC/ybK2Lw=',
      name: 'ACME, Inc.',
      unumIdCustomerUuid: '8125068d-e8c9-4706-83a0-be1485bf7265'
    };
    const company = new Company(companyOptions);
    await companyRepository.persistAndFlush(company);

    options = {
      name: 'ACME, Inc. Holder App',
      uriScheme: 'acme://',
      company,
      apiKey: 'J6A5J3FEJXi+2Xh6JUWpXl5+318dfi1kcwxnMMQKrfc=',
      uuid: uuidv4()
    };
  });

  afterEach(async () => {
    await resetDb(orm.em);
  });

  describe('constructor behavior', () => {
    it('generates createdAt and updatedAt properties', () => {
      const holderApp = new HolderApp(options);
      expect(holderApp.createdAt).toBeDefined();
      expect(holderApp.updatedAt).toBeDefined();
    });

    it('sets name, uriScheme, company, apiKey, and uuid from options', () => {
      const holderApp = new HolderApp(options);
      expect(holderApp.name).toEqual(options.name);
      expect(holderApp.uriScheme).toEqual(options.uriScheme);
      expect(holderApp.company).toEqual(options.company);
      expect(holderApp.apiKey).toEqual(options.apiKey);
      expect(holderApp.uuid).toEqual(options.uuid);
    });
  });

  describe('storage behavior', () => {
    it('saves and retrieves the holderApp', async () => {
      const repository = orm.em.getRepository(HolderApp);
      const initial = new HolderApp(options);
      await repository.persistAndFlush(initial);

      // clear the identity map
      orm.em.clear();

      // find it by UUID
      const saved = await repository.findOneOrFail(initial.uuid, ['company']);
      expect(saved).toEqual(initial);
    });
  });
});
