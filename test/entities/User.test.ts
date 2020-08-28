import { MikroORM } from 'mikro-orm';

import config from '../../src/mikro-orm.config';
import { User, UserOptions } from '../../src/entities/User';
// import { UserOptions } from '../../src/entities/User';
import { Company } from '../../src/entities/Company';

describe('User entity', () => {
  let options: UserOptions;

  beforeAll(async () => {
    const orm = await MikroORM.init(config);
    const repository = orm.em.getRepository(Company);

    const companyOptions = {
      unumIdApiKey: '3n5jhT2vXDEEXlRj09oI9pP6DmWNXNCghUMC/ybK2Lw=',
      name: 'ACME, Inc.',
      unumIdCustomerUuid: '8125068d-e8c9-4706-83a0-be1485bf7265'
    };
    const company = new Company(companyOptions);
    await repository.persistAndFlush(company);

    options = {
      name: 'Testy McTesterson',
      companyUuid: company.uuid
    };
  });

  describe('constructor behavior', () => {
    it('generates uuid, createdAt, and updatedAt properties', () => {
      const user = new User(options);
      expect(user.uuid).toBeDefined();
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('sets name, did, and companyUuid from options', () => {
      const user = new User(options);
      expect(user.name).toEqual(options.name);
      expect(user.did).toEqual(options.did);
      expect(user.companyUuid).toEqual(options.companyUuid);
    });
  });

  describe('storage behavior', () => {
    it('saves and restores the user', async () => {
      const orm = await MikroORM.init(config);
      const repository = orm.em.getRepository(User);
      const initial = new User(options);
      await repository.persistAndFlush(initial);

      // clear the identity map
      orm.em.clear();

      // find it by UUID
      const saved = await repository.findOneOrFail(initial.uuid);
      expect(saved).toEqual({ ...initial, did: null });
    });
  });
});
