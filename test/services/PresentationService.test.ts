import { Server } from 'http';
import supertest from 'supertest';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { BadRequest } from '@feathersjs/errors';

import generateApp from '../../src/generate-app';
import { Presentation } from '../../src/types';
import { Application } from '../../src/declarations';
import { Verifier } from '../../src/entities/Verifier';
import { config } from '../../src/config';

jest.mock('axios');

describe('PresentationService', () => {
  describe('initializing the service', () => {
    it('registers with the app', async () => {
      const app = await generateApp();
      const service = app.service('presentation');
      expect(service).toBeDefined();
    });
  });

  describe('/presentation endpoint', () => {
    let presentation: Presentation;
    let app: Application;
    let server: Server;
    let verifier: Verifier;

    const mockReturnedHeaders = {
      'x-auth-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoidmVyaWZpZXIiLCJ1dWlkIjoiM2VjYzVlZDMtZjdhMC00OTU4LWJjOTgtYjc5NTQxMThmODUyIiwiZGlkIjoiZGlkOnVudW06ZWVhYmU0NGItNjcxMi00NTRkLWIzMWItNTM0NTg4NTlmMTFmIiwiZXhwIjoxNTk1NDcxNTc0LjQyMiwiaWF0IjoxNTk1NTI5NTExfQ.4iJn_a8fHnVsmegdR5uIsdCjXmyZ505x1nA8NVvTEBg'
    };

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
        companyUuid: companyResponse.body.uuid
      };

      const now = new Date();

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

      (axios.post as jest.Mock).mockReturnValueOnce({ data: mockReturnedVerifier, headers: mockReturnedHeaders });

      const verifierResponse = await supertest(app).post('/verifier').send(options);
      verifier = verifierResponse.body;

      presentation = {
        '@context': [
          'https://www.w3.org/2018/credentials/v1'
        ],
        type: [
          'VerifiablePresentation'
        ],
        verifiableCredential: [
          {
            '@context': [
              'https://www.w3.org/2018/credentials/v1'
            ],
            credentialStatus: {
              id: 'https://api.dev-unumid.org//credentialStatus/b2acd26a-ab18-4d18-9ad1-3b77f55c564b',
              type: 'CredentialStatus'
            },
            credentialSubject: {
              id: 'did:unum:3ff2f020-50b0-4f4c-a267-a9f104aedcd8',
              test: 'test'
            },
            issuer: 'did:unum:2e05967f-216f-44c4-ae8e-d6f71cd17c5a',
            type: [
              'VerifiableCredential',
              'TestCredential'
            ],
            id: 'b2acd26a-ab18-4d18-9ad1-3b77f55c564b',
            issuanceDate: new Date('2020-09-03T18:42:30.645Z'),
            proof: {
              created: '2020-09-03T18:42:30.658Z',
              signatureValue: '381yXYx2wa7qR4XMEWeLPWVR7xhksi4684VCZL7Yx9jXneVMxXoa3eT3dA5QU1tofsH4XrGbU8d4pNTiLRpa8iUWvWmAdnfE',
              type: 'secp256r1Signature2020',
              verificationMethod: 'did:unum:2e05967f-216f-44c4-ae8e-d6f71cd17c5a',
              proofPurpose: 'AssertionMethod'
            }
          }
        ],
        presentationRequestUuid: '0cebee3b-3295-4ef6-a4d6-7dfea413b3aa',
        proof: {
          created: '2020-09-03T18:50:52.105Z',
          signatureValue: 'iKx1CJLYue7vopUo2fqGps3TWmxqRxoBDTupumLkaNp2W3UeAjwLUf5WxLRCRkDzEFeKCgT7JdF5fqbpvqnBZoHyYzWYbmW4YQ',
          type: 'secp256r1Signature2020',
          verificationMethod: 'did:unum:3ff2f020-50b0-4f4c-a267-a9f104aedcd8#1e126861-a51b-491f-9206-e2c6b8639fd1',
          proofPurpose: 'AssertionMethod'
        }
      };
    });

    describe('post', () => {
      it('throws if not given the verifier query param', async () => {
        try {
          await supertest(app).post('/presentation').send(presentation);
        } catch (e) {
          expect(e).toEqual(new BadRequest('Verifier query param is required.'));
        }
      });

      it('sends the presentation to the verifier app for verification', async () => {
        await supertest(app).post('/presentation').query({ verifier: verifier.uuid }).send(presentation);
        const expectedUrl = `${config.VERIFIER_URL}/api/verifyPresentation`;
        const expectedHeaders = { 'x-auth-token': verifier.authToken };
        const expectedData = {
          ...presentation,
          verifiableCredential: [{
            ...presentation.verifiableCredential[0],
            issuanceDate: '2020-09-03T18:42:30.645Z'
          }]
        };

        expect((axios.post as jest.Mock)).toBeCalledWith(expectedUrl, expectedData, { headers: expectedHeaders });
      });

      it('returns a success response if the presentation is valid', async () => {
        (axios.post as jest.Mock).mockReturnValueOnce({ data: { verifiedStatus: true }, headers: mockReturnedHeaders });
        const response = await supertest(app).post('/presentation').query({ verifier: verifier.uuid }).send(presentation);
        expect(response.body).toEqual({ isVerified: true });
      });

      it('returns a failure response if the presentation is invalid', async () => {
        (axios.post as jest.Mock).mockReturnValueOnce({ data: { verifiedStatus: false }, headers: mockReturnedHeaders });
        const response = await supertest(app).post('/presentation').query({ verifier: verifier.uuid }).send(presentation);
        expect(response.body).toEqual({ isVerified: false });
      });
    });
  });
});
