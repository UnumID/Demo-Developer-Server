import { Server } from 'http';
import supertest from 'supertest';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import dedent from 'dedent';

import generateApp from '../../src/generate-app';
import { Application } from '../../src/declarations';
import { Verifier } from '../../src/entities/Verifier';
import { config } from '../../src/config';
import { resetDb } from '../resetDb';
import { HolderApp } from '../../src/entities/HolderApp';
import { encrypt } from '@unumid/library-crypto';
import { Issuer } from '../../src/entities/Issuer';
import { EncryptedPresentation, Presentation, EncryptedData, CredentialSubject, PresentationRequest } from '@unumid/types-deprecated-v2';

const now = new Date();

const companyOptions = {
  unumIdApiKey: '3n5jhT2vXDEEXlRj09oI9pP6DmWNXNCghUMC/ybK2Lw=',
  name: 'ACME, Inc.',
  unumIdCustomerUuid: '8125068d-e8c9-4706-83a0-be1485bf7265'
};

const mockReturnedHolderApp = {
  uuid: uuidv4(),
  createdAt: now,
  updatedAt: now,
  customerUuid: companyOptions.unumIdCustomerUuid,
  name: 'ACME Inc. TEST Holder App',
  uriScheme: 'acme://'
};

const requestUuid = uuidv4();
const requestId = uuidv4();

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
  url: `${config.BASE_URL}/presentation`,
  keys: {
    signing: {
      privateKey: '-----BEGIN EC PRIVATE KEY-----MHcCAQEEIIFtwDWUzCbfeikEgD4m6G58hQo51d2Qz6bL11AHDMbDoAoGCCqGSM49AwEHoUQDQgAEwte3H5BXDcJy+4z4avMsNuqXFGYfL3ewcU0pe+UrYbhh6B7oCdvSPocO55BZO5pAOF/qxa/NhwixxqFf9eWVFg==-----END EC PRIVATE KEY-----'
    },
    encryption: {
      privateKey: '-----BEGIN PRIVATE KEY-----MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgm8wJE088DMBsevNbVumkWaD/pQeJMJ/ugoqp3fgSZaahRANCAAR0pYxqjkS76+HwdOFneQggtFSzkx32KwMVlRnUHh51s6adCEnQ1NeLI1pWl4+hVL9tBzshs72Oq1cW0q3hJ38m-----END PRIVATE KEY-----'
    }
  }
};

const mockReturnedRequest: PresentationRequest = {
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
    created: now.toISOString(),
    signatureValue: '381yXYvTZfvdFgv9yRj8vTdQUXPi5w1HSm2QREFNgq3R1o7KbvDqiCcv62kGzkD2Kgq7pvW4WRaRqjV12v3zcxFLXbzGSi4z',
    type: 'secp256r1Signature2020',
    verificationMethod: mockReturnedVerifier.did,
    proofPurpose: 'AssertionMethod'
  },
  metadata: {},
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

jest.mock('axios');
const mockAxiosPost = axios.post as jest.Mock;

describe('PresentationServiceV2', () => {
  describe('initializing the service', () => {
    it('registers with the app', async () => {
      const app = await generateApp();
      const service = app.service('presentationV2');
      expect(service).toBeDefined();
    });
  });

  describe('/presentationV2 endpoint', () => {
    let presentation: Presentation;
    let encryptedPresentationData: EncryptedData;
    let encryptedPresentation: EncryptedPresentation;
    let app: Application;
    let server: Server;
    let verifier: Verifier;
    let issuer: Issuer;
    let holderApp: HolderApp;
    let mockReturnedHeaders;
    let requestUuid;
    let requestId;

    beforeAll(async () => {
      // set up app and wait until server is ready
      app = await generateApp();
      server = app.listen();
      await new Promise((resolve) => server.once('listening', resolve));
    });

    afterAll(async () => {
      // wait until server is closed
      await new Promise(resolve => server.close(resolve));
      mockAxiosPost.mockClear();
    });

    beforeEach(async () => {
      const companyResponse = await supertest(app).post('/company').send(companyOptions);

      mockReturnedHeaders = {
        'x-auth-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoidmVyaWZpZXIiLCJ1dWlkIjoiM2VjYzVlZDMtZjdhMC00OTU4LWJjOTgtYjc5NTQxMThmODUyIiwiZGlkIjoiZGlkOnVudW06ZWVhYmU0NGItNjcxMi00NTRkLWIzMWItNTM0NTg4NTlmMTFmIiwiZXhwIjoxNTk1NDcxNTc0LjQyMiwiaWF0IjoxNTk1NTI5NTExfQ.4iJn_a8fHnVsmegdR5uIsdCjXmyZ505x1nA8NVvTEBg'
      };

      mockAxiosPost.mockReturnValueOnce({ data: mockReturnedVerifier, headers: mockReturnedHeaders })
        .mockReturnValueOnce({ data: mockReturnedIssuer, headers: mockReturnedHeaders })
        .mockReturnValueOnce({ data: mockReturnedHolderApp })
        .mockReturnValueOnce({ data: mockPresentationRequestResponse, headers: mockReturnedHeaders });

      // seed the db with the other objects we'll need
      const verifierOptions = {
        name: 'ACME Inc. TEST Verifier',
        companyUuid: companyResponse.body.uuid
      };

      const issuerOptions = {
        name: 'ACME Inc. TEST Issuer',
        companyUuid: companyResponse.body.uuid
      };

      const userOptions = {
        companyUuid: companyResponse.body.uuid,
        did: `did:unum:${uuidv4()}`
      };

      const verifierResponse = await supertest(app).post('/verifier').send(verifierOptions);
      await supertest(app).post('/user').send(userOptions);

      const issuerResponse = await supertest(app).post('/issuer').send(issuerOptions);

      verifier = verifierResponse.body;
      issuer = issuerResponse.body;

      const holderAppOptions = {
        name: 'ACME Inc. TEST Holder App',
        uriScheme: 'acme://',
        companyUuid: companyResponse.body.uuid,
        apiKey: 'J6A5J3FEJXi+2Xh6JUWpXl5+318dfi1kcwxnMMQKrfc='
      };

      const holderAppResponse = await supertest(app).post('/holderApp').send(holderAppOptions);
      holderApp = holderAppResponse.body;

      const presentationRequestOptions = {
        verifierUuid: verifier.uuid,
        issuerUuid: issuerResponse.body.uuid,
        credentialTypes: ['TestCredential'],
        holderAppUuid: holderApp.uuid
      };

      const presentationRequestResponse = await supertest(app).post('/presentationRequest').send(presentationRequestOptions);

      const credentialSubject:CredentialSubject = {
        id: userOptions.did,
        test: 'test'
      };

      presentation = {
        '@context': [
          'https://www.w3.org/2018/credentials/v1'
        ],
        type: [
          'VerifiablePresentation'
        ],
        verifierDid: verifier.did,
        verifiableCredential: [
          {
            '@context': [
              'https://www.w3.org/2018/credentials/v1'
            ],
            credentialStatus: {
              id: 'https://api.dev-unumid.org//credentialStatus/b2acd26a-ab18-4d18-9ad1-3b77f55c564b',
              type: 'CredentialStatus'
            },
            credentialSubject: JSON.stringify(credentialSubject),
            issuer: mockReturnedIssuer.did,
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
        // presentationRequestUuid: requestUuid,
        presentationRequestId: requestId,
        proof: {
          created: '2020-09-03T18:50:52.105Z',
          signatureValue: 'iKx1CJLYue7vopUo2fqGps3TWmxqRxoBDTupumLkaNp2W3UeAjwLUf5WxLRCRkDzEFeKCgT7JdF5fqbpvqnBZoHyYzWYbmW4YQ',
          type: 'secp256r1Signature2020',
          verificationMethod: 'did:unum:3ff2f020-50b0-4f4c-a267-a9f104aedcd8#1e126861-a51b-491f-9206-e2c6b8639fd1',
          proofPurpose: 'AssertionMethod'
        }
      };

      const dummyRsaPublicKey1 = dedent`-----BEGIN RSA PUBLIC KEY-----
        MIIBCgKCAQEA4O1qt78lCjVsZmsNn8dgVNyouuLMswJFDundq8hngsNQRyulb60F
        cAVd6yDFX7VKvuW/qg8+LOn/96yzgeVYWvgX9kiXmZNhW+WelqksJdq3IjIPqeY7
        SaslBV7z1OJCwefn7PTlozcxWYeVsGuwwxNsI3ZEup9QdSbto1mKAKN1PuntsXKK
        eV91L/KFmD5KQ30p14I5Ku/iWey+0NdYV9DNX6O34LKCY32LBeSgjltYuIs60CeQ
        UrDHPXg3E6Vi4J24JPj1awip0rrRwysEfJ9fkpn5MXqmZQ0j6tUHIkSccXtzJssP
        mm8BsTr/8GQSVyDC8z9yLUw75odNLqF54wIDAQAB
        -----END RSA PUBLIC KEY-----`;

      encryptedPresentationData = encrypt(mockReturnedVerifier.did, dummyRsaPublicKey1, presentation, 'pem');
      encryptedPresentation = {
        // presentationRequestUuid: presentation.presentationRequestUuid,
        presentationRequestInfo: mockPresentationRequestResponse,
        encryptedPresentation: encryptedPresentationData
      };
    });

    afterEach(async () => {
      await resetDb(app.mikro.em);
    });

    describe('post', () => {
      it('sends the presentation to the verifier app for verification', async () => {
        await supertest(app).post('/presentationV2').send(encryptedPresentation).set({ version: '2.0.0' });
        const expectedData = {
          encryptedPresentation: encryptedPresentationData,
          verifier: verifier.did,
          encryptionPrivateKey: verifier.encryptionPrivateKey
        };

        // Testing that axios is being called correctly

        const postBody = mockAxiosPost.mock.calls[4][1];

        expect(postBody).toEqual(expectedData);
      });

      it('returns a success response if the presentation is valid', async () => {
        const verifyReturnValue = {
          type: 'VerifiablePresentation',
          subject: presentation.proof.verificationMethod,
          isVerified: true,
          presentation
        };

        (axios.post as jest.Mock).mockReturnValueOnce({ data: verifyReturnValue, headers: mockReturnedHeaders });
        const response = await supertest(app).post('/presentationV2').send(encryptedPresentation).set({ version: '2.0.0' });
        const expected = {
          isVerified: true,
          type: 'VerifiablePresentation',
          presentationReceiptInfo: {
            subjectDid: presentation.proof.verificationMethod.split('#')[0],
            verifierDid: verifier.did,
            holderApp: holderApp.uuid,
            credentialTypes: ['TestCredential'],
            issuers: {
              [issuer.did]: {
                did: issuer.did,
                name: issuer.name
              }
            },
            presentationRequestUuid: mockPresentationRequestResponse.presentationRequest.uuid
          }
        };
        expect(response.body).toEqual(expected);
      });

      it('saves the shared credentials contained in the presentation', async () => {
        const verifyReturnValue = {
          type: 'VerifiablePresentation',
          subject: presentation.proof.verificationMethod,
          isVerified: true,
          presentation
        };

        (axios.post as jest.Mock).mockReturnValueOnce({ data: verifyReturnValue, headers: mockReturnedHeaders });
        await supertest(app).post('/presentationV2').send(encryptedPresentation);

        const sharedCredentialsResponse = await supertest(app).get('/sharedCredential').send().set({ version: '2.0.0' });

        expect(sharedCredentialsResponse.body.length).toEqual(1);

        // convert dates to ISO string format
        // TODO: write a helper function to do this for any object
        const expected = {
          ...presentation.verifiableCredential[0],
          issuanceDate: presentation.verifiableCredential[0].issuanceDate.toISOString()
        };

        expect(sharedCredentialsResponse.body[0].credential).toEqual(expected);
      });

      describe('handling a Declined Presentation', () => {
        let declinedPresentation: Presentation;
        let encryptedDeclinedPresentationData: EncryptedData;
        let encryptedDeclinedPresentation: EncryptedPresentation;

        beforeEach(() => {
          declinedPresentation = {
            '@context': [
              'https://www.w3.org/2018/credentials/v1'
            ],
            type: ['VerifiablePresentation'],
            presentationRequestId: requestUuid,
            proof: {
              created: '2020-09-03T18:50:52.105Z',
              signatureValue: 'iKx1CJLYue7vopUo2fqGps3TWmxqRxoBDTupumLkaNp2W3UeAjwLUf5WxLRCRkDzEFeKCgT7JdF5fqbpvqnBZoHyYzWYbmW4YQ',
              type: 'secp256r1Signature2020',
              verificationMethod: 'did:unum:3ff2f020-50b0-4f4c-a267-a9f104aedcd8#1e126861-a51b-491f-9206-e2c6b8639fd1',
              proofPurpose: 'AssertionMethod'
            },
            verifierDid: verifier.did
          };
          const dummyRsaPublicKey1 = dedent`-----BEGIN RSA PUBLIC KEY-----
          MIIBCgKCAQEA4O1qt78lCjVsZmsNn8dgVNyouuLMswJFDundq8hngsNQRyulb60F
          cAVd6yDFX7VKvuW/qg8+LOn/96yzgeVYWvgX9kiXmZNhW+WelqksJdq3IjIPqeY7
          SaslBV7z1OJCwefn7PTlozcxWYeVsGuwwxNsI3ZEup9QdSbto1mKAKN1PuntsXKK
          eV91L/KFmD5KQ30p14I5Ku/iWey+0NdYV9DNX6O34LKCY32LBeSgjltYuIs60CeQ
          UrDHPXg3E6Vi4J24JPj1awip0rrRwysEfJ9fkpn5MXqmZQ0j6tUHIkSccXtzJssP
          mm8BsTr/8GQSVyDC8z9yLUw75odNLqF54wIDAQAB
          -----END RSA PUBLIC KEY-----`;
          const mockReturnedVerifier = {
            uuid: uuidv4(),
            did: `did:unum:${uuidv4()}`,
            name: 'ACME Inc. TEST Verifier',
            url: `${config.BASE_URL}/presentationV2`,
            keys: {
              signing: {
                privateKey: '-----BEGIN EC PRIVATE KEY-----MHcCAQEEIIFtwDWUzCbfeikEgD4m6G58hQo51d2Qz6bL11AHDMbDoAoGCCqGSM49AwEHoUQDQgAEwte3H5BXDcJy+4z4avMsNuqXFGYfL3ewcU0pe+UrYbhh6B7oCdvSPocO55BZO5pAOF/qxa/NhwixxqFf9eWVFg==-----END EC PRIVATE KEY-----'
              },
              encryption: {
                privateKey: '-----BEGIN PRIVATE KEY-----MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgm8wJE088DMBsevNbVumkWaD/pQeJMJ/ugoqp3fgSZaahRANCAAR0pYxqjkS76+HwdOFneQggtFSzkx32KwMVlRnUHh51s6adCEnQ1NeLI1pWl4+hVL9tBzshs72Oq1cW0q3hJ38m-----END PRIVATE KEY-----'
              }
            }
          };

          encryptedDeclinedPresentationData = encrypt(mockReturnedVerifier.did, dummyRsaPublicKey1, declinedPresentation, 'pem');
          encryptedDeclinedPresentation = {
            presentationRequestInfo: mockPresentationRequestResponse,
            encryptedPresentation: encryptedDeclinedPresentationData
          };
        });

        it('returns a success response if the DeclinedPresentation is valid', async () => {
          const verifyReturnValue = {
            type: ['DeclinedPresentation'],
            subject: declinedPresentation.proof.verificationMethod,
            isVerified: true,
            presentation
          };

          const expected = {
            isVerified: true,
            type: ['DeclinedPresentation'],
            presentationReceiptInfo: {
              subjectDid: declinedPresentation.proof.verificationMethod.split('#')[0],
              verifierDid: verifier.did,
              holderApp: holderApp.uuid,
              credentialTypes: ['TestCredential'],
              presentationRequestUuid: mockPresentationRequestResponse.presentationRequest.uuid
            }
          };

          (axios.post as jest.Mock).mockReturnValueOnce({ data: verifyReturnValue, headers: mockReturnedHeaders });
          const response = await supertest(app).post('/presentationV2').send(encryptedDeclinedPresentation).set({ version: '2.0.0' });
          expect(response.body).toEqual(expected);
        });

        it('returns a 400 status code if the DeclinedPresentation is not verified', async () => {
          (axios.post as jest.Mock).mockReturnValueOnce({ data: { isVerified: false }, headers: mockReturnedHeaders });
          const response = await supertest(app).post('/presentationV2').send(encryptedDeclinedPresentation).set({ version: '2.0.0' });
          expect(response.status).toEqual(400);
        });
      });

      it('returns 400 status code if the Presentation is not verified', async () => {
        (axios.post as jest.Mock).mockReturnValueOnce({ data: { isVerified: false }, headers: mockReturnedHeaders });
        const response = await supertest(app).post('/presentationV2').send(encryptedPresentation).set({ version: '2.0.0' });
        expect(response.status).toEqual(400);
      });
    });
  });
});
