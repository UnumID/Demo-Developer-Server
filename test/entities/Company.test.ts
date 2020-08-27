import { MikroORM } from 'mikro-orm';

import config from '../../src/mikro-orm.config';
import { Company, CompanyOptions } from '../../src/entities/Company';

describe('Company entity', () => {
  const options: CompanyOptions = {
    unumIdApiKey: '3n5jhT2vXDEEXlRj09oI9pP6DmWNXNCghUMC/ybK2Lw=',
    name: 'ACME, Inc.',
    unumIdCustomerUuid: '8125068d-e8c9-4706-83a0-be1485bf7265'
  };

  describe('constructor behavior', () => {
    it('generates uuid, createdAt, and updatedAt properties', () => {
      const company = new Company(options);
      expect(company.uuid).toBeDefined();
      expect(company.createdAt).toBeDefined();
      expect(company.updatedAt).toBeDefined();
    });

    it('sets name, unumIdApiKey, and unumIdCustomerUuid from options', () => {
      const company = new Company(options);
      expect(company.name).toEqual(options.name);
      expect(company.unumIdApiKey).toEqual(options.unumIdApiKey);
      expect(company.unumIdCustomerUuid).toEqual(options.unumIdCustomerUuid);
    });
  });

  describe('storage behavior', () => {
    it('saves and restores the company', async () => {
      const orm = await MikroORM.init(config);
      const repository = orm.em.getRepository(Company);
      const initial = new Company(options);
      await repository.persistAndFlush(initial);

      // clear the identity map
      orm.em.clear();

      // find it by UUID
      const saved = await repository.findOneOrFail(initial.uuid);
      expect(saved).toEqual(initial);
    });
  });
});
