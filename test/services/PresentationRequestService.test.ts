import { Server } from 'http';
import axios from 'axios';
import supertest from 'supertest';
import { v4 as uuidv4 } from 'uuid';

import generateApp from '../../src/generate-app';
import { resetDb } from '../resetDb';
import { Application } from '../../src/declarations';
import { Verifier } from '../../src/entities/Verifier';
import { HolderApp } from '../../src/entities/HolderApp';
import { User } from '../../src/entities/User';

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
      let holderApp: HolderApp;
      let user: User;
      let presentationRequestResponse;

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
          signing: {
            privateKey: '-----BEGIN EC PRIVATE KEY-----MHcCAQEEIIFtwDWUzCbfeikEgD4m6G58hQo51d2Qz6bL11AHDMbDoAoGCCqGSM49AwEHoUQDQgAEwte3H5BXDcJy+4z4avMsNuqXFGYfL3ewcU0pe+UrYbhh6B7oCdvSPocO55BZO5pAOF/qxa/NhwixxqFf9eWVFg==-----END EC PRIVATE KEY-----'
          },
          encryption: {
            privateKey: '-----BEGIN PRIVATE KEY-----MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgm8wJE088DMBsevNbVumkWaD/pQeJMJ/ugoqp3fgSZaahRANCAAR0pYxqjkS76+HwdOFneQggtFSzkx32KwMVlRnUHh51s6adCEnQ1NeLI1pWl4+hVL9tBzshs72Oq1cW0q3hJ38m-----END PRIVATE KEY-----'
          }
        }
      };

      const mockReturnedHolderApp = {
        uuid: uuidv4(),
        createdAt: now,
        updatedAt: now,
        customerUuid: companyOptions.unumIdCustomerUuid,
        name: 'ACME Inc. TEST Holder App',
        uriScheme: 'acme://'
      };

      const mockReturnedHeaders = {
        'x-auth-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoidmVyaWZpZXIiLCJ1dWlkIjoiM2VjYzVlZDMtZjdhMC00OTU4LWJjOTgtYjc5NTQxMThmODUyIiwiZGlkIjoiZGlkOnVudW06ZWVhYmU0NGItNjcxMi00NTRkLWIzMWItNTM0NTg4NTlmMTFmIiwiZXhwIjoxNTk1NDcxNTc0LjQyMiwiaWF0IjoxNTk1NTI5NTExfQ.4iJn_a8fHnVsmegdR5uIsdCjXmyZ505x1nA8NVvTEBg'
      };

      beforeAll(async () => {
        app = await generateApp();
        server = app.listen();
        await new Promise(resolve => server.once('listening', resolve));

        const companyResponse = await supertest(app).post('/company').send(companyOptions);

        (axios.post as jest.Mock)
          .mockReturnValueOnce({ data: mockReturnedIssuer, headers: mockReturnedHeaders })
          .mockReturnValueOnce({ data: mockReturnedVerifier, headers: mockReturnedHeaders })
          .mockReturnValueOnce({ data: mockReturnedHolderApp });

        const issuerOptions = {
          name: 'ACME Inc. TEST Issuer',
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

        const holderAppOptions = {
          name: 'ACME Inc. TEST Holder App',
          uriScheme: 'acme://',
          companyUuid: companyResponse.body.uuid,
          apiKey: 'J6A5J3FEJXi+2Xh6JUWpXl5+318dfi1kcwxnMMQKrfc='
        };

        const holderAppResponse = await supertest(app).post('/holderApp').send(holderAppOptions);
        holderApp = holderAppResponse.body;

        const userOptions = {
          did: `did:unum:${uuidv4}`,
          companyUuid: companyResponse.body.uuid
        };

        const userResponse = await supertest(app).post('/user').send(userOptions);
        user = userResponse.body;

        await supertest(app).post('/userAuthentication').send({ strategy: 'user', username: 'test-user-123' });

        const requestUuid = uuidv4();
        const requestId = uuidv4();

        const mockReturnedRequest = {
          uuid: requestUuid,
          id: requestId,
          createdAt: now,
          updatedAt: now,
          expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
          verifier: mockReturnedVerifier.did,
          credentialRequests: [
            {
              type: 'TestCredential',
              required: true,
              issuers: [mockReturnedIssuer.did]
            }
          ],
          proof: {
            created: now,
            signatureValue: '381yXYvTZfvdFgv9yRj8vTdQUXPi5w1HSm2QREFNgq3R1o7KbvDqiCcv62kGzkD2Kgq7pvW4WRaRqjV12v3zcxFLXbzGSi4z',
            type: 'secp256r1Signature2020',
            verificationMethod: mockReturnedVerifier.did,
            proofPurpose: 'AssertionMethod'
          },
          metadata: {
            userUuid: user.uuid
          },
          holderAppUuid: mockReturnedHolderApp.uuid
        };

        const mockPresentationRequestResponse = {
          presentationRequest: mockReturnedRequest,
          verifier: {
            name: 'ACME, Inc. Verifier',
            did: mockReturnedVerifier.did
          },
          issuers: {
            [mockReturnedIssuer.did]: {
              name: mockReturnedIssuer.name,
              did: mockReturnedIssuer.did
            }
          },
          deeplink: `acme:///unumid/presentationRequest/${requestUuid}`,
          qrCode: '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'
        };

        (axios.post as jest.Mock).mockReturnValueOnce({ data: mockPresentationRequestResponse, headers: mockReturnedHeaders });

        const options = {
          verifierUuid: verifier.uuid,
          issuerUuid: issuerResponse.body.uuid,
          credentialTypes: ['TestCredential'],
          holderAppUuid: holderApp.uuid,
          userUuid: user.uuid
        };

        presentationRequestResponse = await supertest(app).post('/presentationRequest').send(options);
      });

      afterAll(async () => {
        await resetDb(app.mikro.em);
        await new Promise(resolve => server.close(resolve));
      });

      it('sends the request', () => {
        const expected = {
          verifier: mockReturnedVerifier.did,
          credentialRequests: [{
            type: 'TestCredential',
            required: true,
            issuers: [mockReturnedIssuer.did]
          }],
          eccPrivateKey: mockReturnedVerifier.keys.signing.privateKey,
          holderAppUuid: holderApp.uuid,
          metadata: { fields: { userUuid: user.uuid } }
        };
        expect((axios.post as jest.Mock).mock.calls[3][1]).toEqual(expected);
      });

      it('saves the request in the database', async () => {
        const getResponse = await supertest(app).get(`/presentationRequest/${presentationRequestResponse.body.uuid}`);
        expect(getResponse.status).toEqual(200);
      });
    });
  });
});
