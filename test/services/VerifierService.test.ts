import { Server } from 'http';
import { HookContext } from '@feathersjs/feathers';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import supertest from 'supertest';

import { Application } from '../../src/declarations';
import generateApp from '../../src/generate-app';
import { registerVerifier } from '../../src/services/VerifierService';
import { Verifier } from '../../src/entities/Verifier';
import { resetDb } from '../resetDb';
import { config } from '../../src/config';

jest.mock('axios');
describe('Verifier service', () => {
  describe('initializing the service', () => {
    it('registers with the app', async () => {
      const app = await generateApp();
      const service = app.service('verifier');
      expect(service).toBeDefined();
    });
  });

  describe('hooks', () => {
    const now = new Date();
    const dummyCompany = {
      uuid: uuidv4(),
      unumIdApiKey: '3n5jhT2vXDEEXlRj09oI9pP6DmWNXNCghUMC/ybK2Lw=',
      name: 'ACME, Inc.',
      unumIdCustomerUuid: '8125068d-e8c9-4706-83a0-be1485bf7265',
      createdAt: now,
      updatedAt: now
    };
    const mockGet = jest.fn(() => dummyCompany);
    const mockService = jest.fn(() => ({ get: mockGet }));
    const ctx = {
      app: {
        service: mockService
      },
      data: {
        name: 'ACME Inc. TEST Verifier',
        companyUuid: dummyCompany.uuid
      }
    } as unknown as HookContext;

    const mockReturnedVerifier = {
      uuid: uuidv4(),
      createdAt: now,
      updatedAt: now,
      did: `did:unum:${uuidv4()}`,
      url: `${config.BASE_URL}/presentation`,
      customerUuid: dummyCompany.unumIdCustomerUuid,
      name: 'ACME Inc. TEST Verifier',
      keys: {
        signing: {
          privateKey: '-----BEGIN EC PRIVATE KEY-----MHcCAQEEIIFtwDWUzCbfeikEgD4m6G58hQo51d2Qz6bL11AHDMbDoAoGCCqGSM49AwEHoUQDQgAEwte3H5BXDcJy+4z4avMsNuqXFGYfL3ewcU0pe+UrYbhh6B7oCdvSPocO55BZO5pAOF/qxa/NhwixxqFf9eWVFg==-----END EC PRIVATE KEY-----'
        },
        encryption: {
          privateKey: '-----BEGIN PRIVATE KEY-----MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgm8wJE088DMBsevNbVumkWaD/pQeJMJ/ugoqp3fgSZaahRANCAAR0pYxqjkS76+HwdOFneQggtFSzkx32KwMVlRnUHh51s6adCEnQ1NeLI1pWl4+hVL9tBzshs72Oq1cW0q3hJ38m-----END PRIVATE KEY-----'
        }
      }
    };
    const mockReturnedHeaders = {
      'x-auth-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoidmVyaWZpZXIiLCJ1dWlkIjoiM2VjYzVlZDMtZjdhMC00OTU4LWJjOTgtYjc5NTQxMThmODUyIiwiZGlkIjoiZGlkOnVudW06ZWVhYmU0NGItNjcxMi00NTRkLWIzMWItNTM0NTg4NTlmMTFmIiwiZXhwIjoxNTk1NDcxNTc0LjQyMiwiaWF0IjoxNTk1NTI5NTExfQ.4iJn_a8fHnVsmegdR5uIsdCjXmyZ505x1nA8NVvTEBg'
    };
    (axios.post as jest.Mock).mockReturnValue({ data: mockReturnedVerifier, headers: mockReturnedHeaders });
    describe('registerVerifier', () => {
      it('gets the company', async () => {
        await registerVerifier(ctx);
        expect(mockService).toBeCalledWith('company');
        expect(mockGet).toBeCalledWith(dummyCompany.uuid);
      });

      it('returns a new context with values from the verifier app', async () => {
        const newCtx = await registerVerifier(ctx);
        const newData = newCtx.data;
        expect(newData.privateKey).toEqual(mockReturnedVerifier.keys.signing.privateKey);
        expect(newData.did).toEqual(mockReturnedVerifier.did);
        expect(newData.authToken).toEqual(mockReturnedHeaders['x-auth-token']);
        expect(newData.companyUuid).toEqual(dummyCompany.uuid);
      });
    });
  });

  describe('/verifier endpoint', () => {
    describe('post', () => {
      let server: Server;
      let app: Application;
      let verifier: Verifier;

      beforeAll(async () => {
        app = await generateApp();
        server = app.listen();
        await new Promise((resolve) => server.once('listening', resolve));

        const companyOptions = {
          unumIdApiKey: '3n5jhT2vXDEEXlRj09oI9pP6DmWNXNCghUMC/ybK2Lw=',
          name: 'ACME, Inc.',
          unumIdCustomerUuid: '8125068d-e8c9-4706-83a0-be1485bf7265'
        };
        const companyResponse = await supertest(app).post('/company').send(companyOptions);

        const options = {
          name: 'ACME Inc. TEST Verifier',
          companyUuid: companyResponse.body.uuid,
          verifierApiKey: 'VjYaaxArxZP+EdvatoHz7hRZCE8wS3g+yBNhqJpCkrY='
        };

        const verifierResponse = await supertest(app).post('/verifier').send(options);
        verifier = verifierResponse.body;
      });

      afterAll(async () => {
        await resetDb(app.mikro.em);
        await new Promise((resolve) => server.close(resolve));
      });

      it('saves the verifier in the database', async () => {
        const found = await supertest(app).get(`/verifier/${verifier.uuid}`);
        expect(found.body).toEqual(verifier);
      });
    });
  });
});
