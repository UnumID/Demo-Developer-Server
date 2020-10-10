import { Server } from 'http';
import { HookContext } from '@feathersjs/feathers';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import supertest from 'supertest';

import { Application } from '../../src/declarations';
import generateApp from '../../src/generate-app';
import { registerIssuer } from '../../src/services/IssuerService';
import { Issuer } from '../../src/entities/Issuer';
import { resetDb } from '../resetDb';

jest.mock('axios');
describe('Issuer service', () => {
  const now = new Date();
  const dummyCompany = {
    uuid: uuidv4(),
    unumIdApiKey: '3n5jhT2vXDEEXlRj09oI9pP6DmWNXNCghUMC/ybK2Lw=',
    name: 'ACME, Inc.',
    unumIdCustomerUuid: '8125068d-e8c9-4706-83a0-be1485bf7265',
    createdAt: now,
    updatedAt: now
  };
  const mockGet = jest.fn(() => [dummyCompany]);
  const mockService = jest.fn(() => ({ get: mockGet }));
  const ctx = {
    app: {
      service: mockService
    },
    data: {
      name: 'ACME Inc. TEST Issuer',
      holderUriScheme: 'acme://'
    }
  } as unknown as HookContext;

  const mockReturnedIssuer = {
    uuid: uuidv4(),
    createdAt: now,
    updatedAt: now,
    did: `did:unum:${uuidv4()}`,
    customerUuid: dummyCompany.unumIdCustomerUuid,
    name: 'ACME Inc. TEST Issuer',
    keys: {
      signing: {
        privateKey: '-----BEGIN EC PRIVATE KEY-----MHcCAQEEIIFtwDWUzCbfeikEgD4m6G58hQo51d2Qz6bL11AHDMbDoAoGCCqGSM49AwEHoUQDQgAEwte3H5BXDcJy+4z4avMsNuqXFGYfL3ewcU0pe+UrYbhh6B7oCdvSPocO55BZO5pAOF/qxa/NhwixxqFf9eWVFg==-----END EC PRIVATE KEY-----'
      }
    }
  };
  const mockReturnedHeaders = {
    'x-auth-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoidmVyaWZpZXIiLCJ1dWlkIjoiM2VjYzVlZDMtZjdhMC00OTU4LWJjOTgtYjc5NTQxMThmODUyIiwiZGlkIjoiZGlkOnVudW06ZWVhYmU0NGItNjcxMi00NTRkLWIzMWItNTM0NTg4NTlmMTFmIiwiZXhwIjoxNTk1NDcxNTc0LjQyMiwiaWF0IjoxNTk1NTI5NTExfQ.4iJn_a8fHnVsmegdR5uIsdCjXmyZ505x1nA8NVvTEBg'
  };
  (axios.post as jest.Mock).mockReturnValue({ data: mockReturnedIssuer, headers: mockReturnedHeaders });

  describe('initializing the service', () => {
    it('registers with the app', async () => {
      const app = await generateApp();
      const service = app.service('issuer');
      expect(service).toBeDefined();
    });
  });

  describe('hooks', () => {
    describe('registerIssuer', () => {
      it('gets the company', async () => {
        await registerIssuer(ctx);
        expect(mockService).toBeCalledWith('company');
        expect(mockGet).toBeCalled();
      });

      it('returns a new context with values from the issuer app', async () => {
        const newCtx = await registerIssuer(ctx);
        const newData = newCtx.data;
        expect(newData.privateKey).toEqual(mockReturnedIssuer.keys.signing.privateKey);
        expect(newData.did).toEqual(mockReturnedIssuer.did);
        expect(newData.authToken).toEqual(mockReturnedHeaders['x-auth-token']);
      });
    });
  });

  describe('/issuer endpoint', () => {
    describe('post', () => {
      let server: Server;
      let app: Application;
      let issuer: Issuer;

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
          name: 'ACME Inc. TEST Issuer',
          holderUriScheme: 'acme://',
          companyUuid: companyResponse.body.uuid,
          issuerApiKey: 'VjYaaxArxZP+EdvatoHz7hRZCE8wS3g+yBNhqJpCkrY='
        };

        const issuerResponse = await supertest(app).post('/issuer').send(options);
        issuer = issuerResponse.body;
      });

      afterAll(async () => {
        await resetDb(app.mikro.em);
        await new Promise((resolve) => server.close(resolve));
      });

      it('saves the issuer in the database', async () => {
        const found = await supertest(app).get(`/issuer/${issuer.uuid}`);
        expect(found.body).toEqual(issuer);
      });
    });
  });
});
