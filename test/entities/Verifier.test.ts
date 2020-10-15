import { MikroORM } from 'mikro-orm';

import mikroOrmConfig from '../../src/mikro-orm.config';
import { Verifier, VerifierOptions } from '../../src/entities/Verifier';
import { Company } from '../../src/entities/Company';
import { resetDb } from '../resetDb';
import { config } from '../../src/config';

describe('Verifier entity', () => {
  let options: VerifierOptions;
  let orm;

  beforeEach(async () => {
    orm = await MikroORM.init(mikroOrmConfig);
    const repository = orm.em.getRepository(Company);

    const companyOptions = {
      unumIdApiKey: '3n5jhT2vXDEEXlRj09oI9pP6DmWNXNCghUMC/ybK2Lw=',
      name: 'ACME, Inc.',
      unumIdCustomerUuid: '8125068d-e8c9-4706-83a0-be1485bf7265'
    };
    const company = new Company(companyOptions);
    await repository.persistAndFlush(company);

    options = {
      name: 'ACME, Inc. Verifier',
      did: 'did:unum:e9305322-f642-45c4-9efc-cf4f5326cd6a',
      privateKey: '-----BEGIN EC PRIVATE KEY-----MHcCAQEEIIFtwDWUzCbfeikEgD4m6G58hQo51d2Qz6bL11AHDMbDoAoGCCqGSM49AwEHoUQDQgAEwte3H5BXDcJy+4z4avMsNuqXFGYfL3ewcU0pe+UrYbhh6B7oCdvSPocO55BZO5pAOF/qxa/NhwixxqFf9eWVFg==-----END EC PRIVATE KEY-----',
      authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoidmVyaWZpZXIiLCJ1dWlkIjoiM2VjYzVlZDMtZjdhMC00OTU4LWJjOTgtYjc5NTQxMThmODUyIiwiZGlkIjoiZGlkOnVudW06ZWVhYmU0NGItNjcxMi00NTRkLWIzMWItNTM0NTg4NTlmMTFmIiwiZXhwIjoxNTk1NDcxNTc0LjQyMiwiaWF0IjoxNTk1NTI5NTExfQ.4iJn_a8fHnVsmegdR5uIsdCjXmyZ505x1nA8NVvTEBg',
      companyUuid: company.uuid
    };

    // clear the identity map
    orm.em.clear();
  });

  afterEach(async () => {
    await resetDb(orm.em);
  });

  describe('constructor behavior', () => {
    it('generates uuid, createdAt, and updatedAt properties', () => {
      const verifier = new Verifier(options);
      expect(verifier.uuid).toBeDefined();
      expect(verifier.createdAt).toBeDefined();
      expect(verifier.updatedAt).toBeDefined();
    });

    it('sets properties from options', () => {
      const verifier = new Verifier(options);
      expect(verifier.name).toEqual(options.name);
      expect(verifier.did).toEqual(options.did);
      expect(verifier.privateKey).toEqual(options.privateKey);
      expect(verifier.authToken).toEqual(options.authToken);
      expect(verifier.companyUuid).toEqual(options.companyUuid);
    });

    it('sets the url', () => {
      const verifier = new Verifier(options);
      expect(verifier.url).toEqual(`${config.BASE_URL}/presentation`);
    });
  });

  describe('storage behavior', () => {
    it('saves and restores the verifier', async () => {
      const repository = orm.em.getRepository(Verifier);
      const initial = new Verifier(options);
      await repository.persistAndFlush(initial);

      // clear the identity map
      orm.em.clear();

      // find it by UUID
      const saved = await repository.findOneOrFail(initial.uuid);
      expect(saved).toEqual(initial);
    });
  });
});
