import { Server } from 'http';
import axios from 'axios';
import supertest from 'supertest';
import { v4 as uuidv4 } from 'uuid';

import generateApp from '../../src/generate-app';
import { resetDb } from '../resetDb';
import { Application } from '../../src/declarations';
import { config } from '../../src/config';
import { Verifier } from '../../src/entities/Verifier';

jest.mock('axios');
describe('PresentationRequest service', () => {
  describe('initializing the service', () => {
    it('registers with the app', async () => {
      const app = await generateApp();
      const service = app.service('presentationRequest');
      expect(service).toBeDefined();
    });
  });

  describe('/presentationRequest endpoint', () => {
    describe('post', () => {
      let server: Server;
      let app: Application;
      let verifier: Verifier;

      const companyOptions = {
        unumIdApiKey: '3n5jhT2vXDEEXlRj09oI9pP6DmWNXNCghUMC/ybK2Lw=',
        name: 'ACME, Inc.',
        unumIdCustomerUuid: '8125068d-e8c9-4706-83a0-be1485bf7265'
      };

      const now = new Date();

      const mockReturnedIssuer = {
        uuid: uuidv4(),
        createdAt: now,
        updatedAt: now,
        did: `did:unum:${uuidv4()}`,
        customerUuid: companyOptions.unumIdCustomerUuid,
        name: 'ACME Inc. TEST Issuer',
        keys: {
          signing: {
            privateKey: '-----BEGIN EC PRIVATE KEY-----MHcCAQEEIIFtwDWUzCbfeikEgD4m6G58hQo51d2Qz6bL11AHDMbDoAoGCCqGSM49AwEHoUQDQgAEwte3H5BXDcJy+4z4avMsNuqXFGYfL3ewcU0pe+UrYbhh6B7oCdvSPocO55BZO5pAOF/qxa/NhwixxqFf9eWVFg==-----END EC PRIVATE KEY-----'
          }
        }
      };

      const mockReturnedVerifier = {
        uuid: uuidv4(),
        createdAt: now,
        updatedAt: now,
        did: `did:unum:${uuidv4()}`,
        customerUuid: companyOptions.unumIdCustomerUuid,
        name: 'ACME Inc. TEST Verifier',
        keys: {
          privateKey: '-----BEGIN EC PRIVATE KEY-----MHcCAQEEIIFtwDWUzCbfeikEgD4m6G58hQo51d2Qz6bL11AHDMbDoAoGCCqGSM49AwEHoUQDQgAEwte3H5BXDcJy+4z4avMsNuqXFGYfL3ewcU0pe+UrYbhh6B7oCdvSPocO55BZO5pAOF/qxa/NhwixxqFf9eWVFg==-----END EC PRIVATE KEY-----'
        }
      };

      const mockReturnedHeaders = {
        'x-auth-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoidmVyaWZpZXIiLCJ1dWlkIjoiM2VjYzVlZDMtZjdhMC00OTU4LWJjOTgtYjc5NTQxMThmODUyIiwiZGlkIjoiZGlkOnVudW06ZWVhYmU0NGItNjcxMi00NTRkLWIzMWItNTM0NTg4NTlmMTFmIiwiZXhwIjoxNTk1NDcxNTc0LjQyMiwiaWF0IjoxNTk1NTI5NTExfQ.4iJn_a8fHnVsmegdR5uIsdCjXmyZ505x1nA8NVvTEBg'
      };

      const requestUuid = uuidv4();
      const mockReturnedRequest = {
        uuid: requestUuid,
        createdAt: now,
        updatedAt: now,
        expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
        verifier: {
          name: 'ACME, Inc. Verifier',
          did: mockReturnedVerifier.did,
          url: `${config.BASE_URL}/presentation?verifier=${mockReturnedVerifier.uuid}`
        },
        credentialRequests: [
          {
            type: 'TestCredential',
            required: true,
            issuers: [
              {
                did: mockReturnedIssuer.did,
                name: 'ACME Inc. TEST Issuer',
                required: true
              }
            ]
          }
        ],
        proof: {
          created: now,
          signatureValue: '381yXYvTZfvdFgv9yRj8vTdQUXPi5w1HSm2QREFNgq3R1o7KbvDqiCcv62kGzkD2Kgq7pvW4WRaRqjV12v3zcxFLXbzGSi4z',
          type: 'secp256r1Signature2020',
          verificationMethod: mockReturnedVerifier.did,
          proofPurpose: 'AssertionMethod'
        },
        metadata: {},
        deeplink: `acme:///unumid-holder/presentationRequest/${requestUuid}`
      };

      beforeAll(async () => {
        app = await generateApp();
        server = app.listen();
        await new Promise(resolve => server.once('listening', resolve));

        const companyResponse = await supertest(app).post('/company').send(companyOptions);

        (axios.post as jest.Mock)
          .mockReturnValueOnce({ data: mockReturnedIssuer, headers: mockReturnedHeaders })
          .mockReturnValueOnce({ data: mockReturnedVerifier, headers: mockReturnedHeaders })
          .mockReturnValueOnce({ data: mockReturnedRequest, headers: mockReturnedHeaders });

        const issuerOptions = {
          name: 'ACME Inc. TEST Issuer',
          holderUriScheme: 'acme://',
          companyUuid: companyResponse.body.uuid,
          issuerApiKey: 'VjYaaxArxZP+EdvatoHz7hRZCE8wS3g+yBNhqJpCkrY='
        };

        const issuerResponse = await supertest(app).post('/issuer').send(issuerOptions);

        const verifierOptions = {
          name: 'ACME Inc. TEST Verifier',
          companyUuid: companyResponse.body.uuid
        };

        const verifierResponse = await supertest(app).post('/verifier').send(verifierOptions);
        verifier = verifierResponse.body;

        const options = {
          verifierUuid: verifier.uuid,
          issuerUuid: issuerResponse.body.uuid,
          credentialTypes: ['TestCredential']
        };

        await supertest(app).post('/presentationRequest').send(options);
      });

      afterAll(async () => {
        await resetDb(app.mikro.em);
        await new Promise(resolve => server.close(resolve));
      });

      it('sends the request', () => {
        const expected = {
          verifier: {
            name: mockReturnedVerifier.name,
            did: mockReturnedVerifier.did,
            url: `${config.BASE_URL}/presentation?verifier=${verifier.uuid}`
          },
          credentialRequests: [{
            type: 'TestCredential',
            required: true,
            issuers: [{
              did: mockReturnedIssuer.did,
              name: mockReturnedIssuer.name,
              required: true
            }]
          }],
          eccPrivateKey: mockReturnedVerifier.keys.privateKey
        };
        expect((axios.post as jest.Mock).mock.calls[2][1]).toEqual(expected);
      });
    });
  });
});
