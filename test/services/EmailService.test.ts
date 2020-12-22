
import { Server } from 'http';
import axios from 'axios';
import supertest from 'supertest';
import { v4 } from 'uuid';

import generateApp from '../../src/generate-app';
import { Application } from '../../src/declarations';
import { Verifier } from '../../src/entities/Verifier';
import { resetDb } from '../resetDb';

jest.mock('axios');

describe('EmailService', () => {
  describe('initializing the service', () => {
    it('registers with the app', async () => {
      const app = await generateApp();
      const service = app.service('email');
      expect(service).toBeDefined();
    });
  });

  describe('/email endpoint', () => {
    describe('post', () => {
      let server: Server;
      let app: Application;
      let verifier: Verifier;

      beforeAll(async () => {
        app = await generateApp();
        server = app.listen();
        await new Promise(resolve => server.once('listening', resolve));

        const now = new Date();

        const companyOptions = {
          unumIdApiKey: '3n5jhT2vXDEEXlRj09oI9pP6DmWNXNCghUMC/ybK2Lw=',
          name: 'ACME, Inc.',
          unumIdCustomerUuid: '8125068d-e8c9-4706-83a0-be1485bf7265'
        };

        const companyResponse = await supertest(app).post('/company').send(companyOptions);

        const mockReturnedVerifier = {
          uuid: v4(),
          createdAt: now,
          updatedAt: now,
          did: `did:unum:${v4()}`,
          customerUuid: companyOptions.unumIdCustomerUuid,
          name: 'ACME Inc. TEST Verifier',
          keys: {
            signing: {
              privateKey: '-----BEGIN EC PRIVATE KEY-----MHcCAQEEIIFtwDWUzCbfeikEgD4m6G58hQo51d2Qz6bL11AHDMbDoAoGCCqGSM49AwEHoUQDQgAEwte3H5BXDcJy+4z4avMsNuqXFGYfL3ewcU0pe+UrYbhh6B7oCdvSPocO55BZO5pAOF/qxa/NhwixxqFf9eWVFg==-----END EC PRIVATE KEY-----'
            }
          }
        };

        const mockReturnedHeaders = {
          'x-auth-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoidmVyaWZpZXIiLCJ1dWlkIjoiM2VjYzVlZDMtZjdhMC00OTU4LWJjOTgtYjc5NTQxMThmODUyIiwiZGlkIjoiZGlkOnVudW06ZWVhYmU0NGItNjcxMi00NTRkLWIzMWItNTM0NTg4NTlmMTFmIiwiZXhwIjoxNTk1NDcxNTc0LjQyMiwiaWF0IjoxNTk1NTI5NTExfQ.4iJn_a8fHnVsmegdR5uIsdCjXmyZ505x1nA8NVvTEBg'
        };

        (axios.post as jest.Mock)
          .mockResolvedValueOnce({ data: mockReturnedVerifier, headers: mockReturnedHeaders })
          .mockResolvedValueOnce({ data: { success: true }, headers: mockReturnedHeaders });

        const verifierOptions = {
          name: 'ACME Inc. TEST Verifier',
          companyUuid: companyResponse.body.uuid
        };

        const verifierResponse = await supertest(app).post('/verifier').send(verifierOptions);
        verifier = verifierResponse.body;
      });

      afterAll(async () => {
        await resetDb(app.mikro.em);
        await new Promise(resolve => server.close(resolve));
      });

      it('sends the email', async () => {
        const options = {
          to: 'test@unumid.org',
          subject: 'test subject',
          htmlBody: '<h1>header</h1><div>test body</div>'
        };

        const response = await supertest(app).post('/email').send(options);
        expect(true).toBe(true);
        expect(axios.post).toBeCalled();
        expect(response.body).toEqual({ success: true });
      });
    });
  });
});
