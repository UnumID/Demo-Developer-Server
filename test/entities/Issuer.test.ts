import { MikroORM } from 'mikro-orm';

import config from '../../src/mikro-orm.config';
import { Issuer, IssuerOptions } from '../../src/entities/Issuer';
import { Company } from '../../src/entities/Company';
import { resetDb } from '../resetDb';

describe('Issuer entity', () => {
  let options: IssuerOptions;
  let orm;

  beforeEach(async () => {
    orm = await MikroORM.init(config);
    const repository = orm.em.getRepository(Company);

    const companyOptions = {
      unumIdApiKey: '3n5jhT2vXDEEXlRj09oI9pP6DmWNXNCghUMC/ybK2Lw=',
      name: 'ACME, Inc.',
      unumIdCustomerUuid: '8125068d-e8c9-4706-83a0-be1485bf7265'
    };
    const company = new Company(companyOptions);
    await repository.persistAndFlush(company);

    options = {
      name: 'ACME, Inc. Issuer',
      did: 'did:unum:e9305322-f642-45c4-9efc-cf4f5326cd6a',
      uriScheme: 'acme://',
      privateKey: '-----BEGIN EC PRIVATE KEY-----MHcCAQEEIIFtwDWUzCbfeikEgD4m6G58hQo51d2Qz6bL11AHDMbDoAoGCCqGSM49AwEHoUQDQgAEwte3H5BXDcJy+4z4avMsNuqXFGYfL3ewcU0pe+UrYbhh6B7oCdvSPocO55BZO5pAOF/qxa/NhwixxqFf9eWVFg==-----END EC PRIVATE KEY-----',
      authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoidmVyaWZpZXIiLCJ1dWlkIjoiM2VjYzVlZDMtZjdhMC00OTU4LWJjOTgtYjc5NTQxMThmODUyIiwiZGlkIjoiZGlkOnVudW06ZWVhYmU0NGItNjcxMi00NTRkLWIzMWItNTM0NTg4NTlmMTFmIiwiZXhwIjoxNTk1NDcxNTc0LjQyMiwiaWF0IjoxNTk1NTI5NTExfQ.4iJn_a8fHnVsmegdR5uIsdCjXmyZ505x1nA8NVvTEBg',
      companyUuid: company.uuid
    };

    // clear the identity map
    orm.em.clear();
  });

  afterEach(async () => {
    orm.em.clear();
    await resetDb(orm.em);
  });

  describe('constructor behavior', () => {
    it('generates uuid, createdAt, and updatedAt properties', () => {
      const issuer = new Issuer(options);
      expect(issuer.uuid).toBeDefined();
      expect(issuer.createdAt).toBeDefined();
      expect(issuer.updatedAt).toBeDefined();
    });

    it('sets properties from options', () => {
      const issuer = new Issuer(options);
      expect(issuer.name).toEqual(options.name);
      expect(issuer.did).toEqual(options.did);
      expect(issuer.uriScheme).toEqual(options.uriScheme);
      expect(issuer.privateKey).toEqual(options.privateKey);
      expect(issuer.authToken).toEqual(options.authToken);
      expect(issuer.companyUuid).toEqual(options.companyUuid);
    });
  });

  describe('storage behavior', () => {
    it('saves and restores the issuer', async () => {
      const repository = orm.em.getRepository(Issuer);
      const initial = new Issuer(options);
      await repository.persistAndFlush(initial);

      // clear the identity map
      orm.em.clear();

      // find it by UUID
      const saved = await repository.findOneOrFail(initial.uuid);
      expect(saved).toEqual(initial);
    });
  });
});
