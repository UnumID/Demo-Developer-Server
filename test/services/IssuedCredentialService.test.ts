import { Server } from 'http';
import { HookContext } from '@feathersjs/feathers';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import supertest from 'supertest';

import generateApp from '../../src/generate-app';
import { issueCredential } from '../../src/services/IssuedCredentialService';
import { Application } from '../../src/declarations';
import { IssuedCredential } from '../../src/entities/IssuedCredential';
import { resetDb } from '../resetDb';

jest.mock('axios');
describe('IssuedCredential service', () => {
  const now = new Date();
  const dummyCompany = {
    uuid: uuidv4(),
    unumIdApiKey: '3n5jhT2vXDEEXlRj09oI9pP6DmWNXNCghUMC/ybK2Lw=',
    name: 'ACME, Inc.',
    unumIdCustomerUuid: '8125068d-e8c9-4706-83a0-be1485bf7265',
    createdAt: now,
    updatedAt: now
  };

  const dummyIssuer = {
    uuid: uuidv4(),
    companyUuid: dummyCompany.uuid,
    name: 'ACME, Inc. Issuer',
    privateKey: '-----BEGIN EC PRIVATE KEY-----MHcCAQEEIIFtwDWUzCbfeikEgD4m6G58hQo51d2Qz6bL11AHDMbDoAoGCCqGSM49AwEHoUQDQgAEwte3H5BXDcJy+4z4avMsNuqXFGYfL3ewcU0pe+UrYbhh6B7oCdvSPocO55BZO5pAOF/qxa/NhwixxqFf9eWVFg==-----END EC PRIVATE KEY-----',
    authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoidmVyaWZpZXIiLCJ1dWlkIjoiM2VjYzVlZDMtZjdhMC00OTU4LWJjOTgtYjc5NTQxMThmODUyIiwiZGlkIjoiZGlkOnVudW06ZWVhYmU0NGItNjcxMi00NTRkLWIzMWItNTM0NTg4NTlmMTFmIiwiZXhwIjoxNTk1NDcxNTc0LjQyMiwiaWF0IjoxNTk1NTI5NTExfQ.4iJn_a8fHnVsmegdR5uIsdCjXmyZ505x1nA8NVvTEBg',
    did: `did:unum:${uuidv4()}`
  };

  const dummyUser = {
    uuid: uuidv4(),
    name: 'Testy McTesterson',
    did: `did:unum:${uuidv4()}`,
    companyUuid: dummyCompany.uuid
  };

  const mockGetIssuer = jest.fn(() => dummyIssuer);
  const mockGetUser = jest.fn(() => dummyUser);

  const mockService = jest.fn();

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

  const dummyHeaders = {
    'x-auth-token': dummyIssuer.authToken
  };

  (axios.post as jest.Mock).mockReturnValue({ data: dummyCredential, headers: dummyHeaders });

  describe('initializing the service', () => {
    it('registers with the app', async () => {
      const app = await generateApp();
      const service = app.service('credential');
      expect(service).toBeDefined();
    });
  });

  describe('hooks', () => {
    describe('issueCredential', () => {
      const ctx = {
        app: {
          service: mockService
        },
        data: {
          claims: { test: 'test' },
          issuerUuid: dummyIssuer.uuid,
          userUuid: dummyUser.uuid,
          type: 'TestCredential'
        }
      } as unknown as HookContext;

      beforeEach(() => {
        mockService.mockReturnValueOnce({ get: mockGetIssuer });
        mockService.mockReturnValueOnce({ get: mockGetUser });
      });

      it('gets the issuer and user', async () => {
        await issueCredential(ctx);
        expect(mockService).toBeCalledWith('issuer');
        expect(mockService).toBeCalledWith('user');

        expect(mockGetIssuer).toBeCalledWith(dummyIssuer.uuid);
        expect(mockGetUser).toBeCalledWith(dummyUser.uuid);
      });

      it('issues a credential', async () => {
        await issueCredential(ctx);
        const expected = {
          credentialSubject: {
            id: dummyUser.did,
            test: 'test'
          },
          issuer: dummyIssuer.did,
          type: ['TestCredential'],
          eccPrivateKey: dummyIssuer.privateKey,
          expirationDate: undefined
        };
        expect((axios.post as jest.Mock).mock.calls[0][1]).toEqual(expected);
      });

      it('sends the issuer auth token to the issuer app', async () => {
        await issueCredential(ctx);

        const expected = { headers: { Authorization: `Bearer ${dummyIssuer.authToken}` } };

        expect((axios.post as jest.Mock).mock.calls[0][2]).toEqual(expected);
      });

      it('returns a new context with the issued credential', async () => {
        const newCtx = await issueCredential(ctx);
        const expected = {
          credential: dummyCredential,
          issuerUuid: ctx.data.issuerUuid,
          userUuid: ctx.data.userUuid
        };
        expect(newCtx.data).toEqual(expected);
      });
    });

    describe('/credential endpoint', () => {
      describe('post', () => {
        let server: Server;
        let app: Application;
        let issuedCredential: IssuedCredential;

        beforeAll(async () => {
          app = await generateApp();
          server = app.listen();
          await new Promise((resolve) => server.once('listening', resolve));

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
          (axios.post as jest.Mock).mockReturnValueOnce({ data: mockReturnedIssuer, headers: mockReturnedHeaders });
          (axios.post as jest.Mock).mockReturnValueOnce({ data: dummyCredential, headers: mockReturnedHeaders });

          const companyOptions = {
            unumIdApiKey: '3n5jhT2vXDEEXlRj09oI9pP6DmWNXNCghUMC/ybK2Lw=',
            name: 'ACME, Inc.',
            unumIdCustomerUuid: '8125068d-e8c9-4706-83a0-be1485bf7265'
          };
          const companyResponse = await supertest(app).post('/company').send(companyOptions);

          const issuerOptions = {
            name: 'ACME Inc. TEST Issuer',
            companyUuid: companyResponse.body.uuid,
            issuerApiKey: 'VjYaaxArxZP+EdvatoHz7hRZCE8wS3g+yBNhqJpCkrY='
          };

          const issuerResponse = await supertest(app).post('/issuer').send(issuerOptions);

          const userOptions = {
            name: 'Testy McTesterson',
            companyUuid: companyResponse.body.uuid,
            did: `did:unum:${uuidv4()}`
          };

          const userResponse = await supertest(app).post('/user').send(userOptions);

          const options = {
            issuerUuid: issuerResponse.body.uuid,
            userUuid: userResponse.body.uuid,
            type: 'TestCredential',
            claims: { test: 'test' }
          };

          const credentialResponse = await supertest(app).post('/credential').send(options);
          issuedCredential = credentialResponse.body;
        });

        afterAll(async () => {
          await resetDb(app.mikro.em);
          await new Promise((resolve) => server.close(resolve));
        });

        it('saves the issued credential to the database', async () => {
          const found = await supertest(app).get(`/credential/${issuedCredential.uuid}`);
          expect(found.body).toEqual(issuedCredential);
        });
      });
    });
  });
});
