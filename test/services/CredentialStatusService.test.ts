import { Server } from 'http';
import axios from 'axios';
import supertest from 'supertest';
import { v4 } from 'uuid';

import generateApp from '../../src/generate-app';
import { Application } from '../../src/declarations';
import { resetDb } from '../resetDb';
import { IssuedCredential } from '../../src/entities/IssuedCredential';

jest.mock('axios');

describe('CredentialStatusService', () => {
  const now = new Date();
  const dummyCompany = {
    uuid: v4(),
    unumIdApiKey: '3n5jhT2vXDEEXlRj09oI9pP6DmWNXNCghUMC/ybK2Lw=',
    name: 'ACME, Inc.',
    unumIdCustomerUuid: '8125068d-e8c9-4706-83a0-be1485bf7265',
    createdAt: now,
    updatedAt: now
  };

  const dummyIssuer = {
    uuid: v4(),
    companyUuid: dummyCompany.uuid,
    name: 'ACME, Inc. Issuer',
    privateKey: '-----BEGIN EC PRIVATE KEY-----MHcCAQEEIIFtwDWUzCbfeikEgD4m6G58hQo51d2Qz6bL11AHDMbDoAoGCCqGSM49AwEHoUQDQgAEwte3H5BXDcJy+4z4avMsNuqXFGYfL3ewcU0pe+UrYbhh6B7oCdvSPocO55BZO5pAOF/qxa/NhwixxqFf9eWVFg==-----END EC PRIVATE KEY-----',
    authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoidmVyaWZpZXIiLCJ1dWlkIjoiM2VjYzVlZDMtZjdhMC00OTU4LWJjOTgtYjc5NTQxMThmODUyIiwiZGlkIjoiZGlkOnVudW06ZWVhYmU0NGItNjcxMi00NTRkLWIzMWItNTM0NTg4NTlmMTFmIiwiZXhwIjoxNTk1NDcxNTc0LjQyMiwiaWF0IjoxNTk1NTI5NTExfQ.4iJn_a8fHnVsmegdR5uIsdCjXmyZ505x1nA8NVvTEBg',
    did: `did:unum:${v4()}`
  };

  const dummyUser = {
    uuid: v4(),
    name: 'Testy McTesterson',
    did: `did:unum:${v4()}`,
    companyUuid: dummyCompany.uuid
  };

  const dummyCredential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: '0c93beb0-2605-4650-b698-3fd92eb110b9',
    credentialSubject: {
      id: dummyUser.did,
      test: 'test'
    },
    credentialStatus: {
      id: 'https://api.dev-unumid.org/credentialStatus/0c93beb0-2605-4650-b698-3fd92eb110b9',
      type: 'CredentialStatus'
    },
    issuer: dummyIssuer.did,
    type: ['VerifiableCredential', 'DummyCredential'],
    issuanceDate: new Date('2020-05-26T23:07:12.770Z'),
    proof: {
      created: '2020-05-26T23:07:12.770Z',
      signatureValue: 'AN1rKqzbXLkDeDiqPAdddiwYoH4v4ZBpga81RmPGtz8AxH2PuNETE9enHofQGZfyduEMA2rPzyWGaPfHMQQgmMZADecRchjJE',
      proofPurpose: 'assertionMethod',
      type: 'secp256r1Signature2020',
      verificationMethod: 'did:unum:880e33d9-888c-4fc2-a98c-602293793ce4#79064dc8-1367-4c98-a8b5-ad601e49e196'
    }
  };

  describe('initializing the service', () => {
    it('registers with the app', async () => {
      const app = await generateApp();
      const service = app.service('credentialStatus');
      expect(service).toBeDefined();
    });
  });

  describe('/credentialStatus endpoint', () => {
    describe('patch', () => {
      let server: Server;
      let app: Application;
      let credential: IssuedCredential;

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

        const mockReturnedIssuer = {
          uuid: v4(),
          createdAt: now,
          updatedAt: now,
          did: `did:unum:${v4()}`,
          customerUuid: companyResponse.body.unumIdCustomerUuid,
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

        (axios.post as jest.Mock)
          .mockResolvedValueOnce({ data: mockReturnedIssuer, headers: mockReturnedHeaders })
          .mockReturnValueOnce({ data: dummyCredential, headers: mockReturnedHeaders })
          .mockResolvedValueOnce({ data: { success: true }, headers: mockReturnedHeaders });

        const issuerOptions = {
          name: 'ACME Inc. TEST Issuer',
          companyUuid: companyResponse.body.uuid,
          issuerApiKey: 'VjYaaxArxZP+EdvatoHz7hRZCE8wS3g+yBNhqJpCkrY='
        };

        const issuerResponse = await supertest(app).post('/issuer').send(issuerOptions);

        const userOptions = {
          name: 'Testy McTesterson',
          companyUuid: companyResponse.body.uuid,
          did: `did:unum:${v4()}`
        };

        const userResponse = await supertest(app).post('/user').send(userOptions);

        const credentialOptions = {
          issuerUuid: issuerResponse.body.uuid,
          userUuid: userResponse.body.uuid,
          type: 'TestCredential',
          claims: { test: 'test' }
        };

        const credentialResponse = await supertest(app).post('/credential').send(credentialOptions);
        credential = credentialResponse.body;
      });

      afterAll(async () => {
        await resetDb(app.mikro.em);
        await new Promise(resolve => server.close(resolve));
      });

      it('calls the issuer app to revoke the credential', async () => {
        const credentialId = credential.credential.id;

        const response = await supertest(app).patch(`/credentialStatus/${credentialId}`).send();
        expect(axios.post).toBeCalled();
        expect(response.body).toEqual({ success: true });
      });
    });
  });
});
