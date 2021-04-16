import { Server } from 'http';
import supertest from 'supertest';
import axios from 'axios';
import { v4 as uuidv4, v4 } from 'uuid';
import dedent from 'dedent';

import generateApp from '../../src/generate-app';
import { Presentation, NoPresentation, EncryptedData } from '../../src/types';
import { Application } from '../../src/declarations';
import { Verifier } from '../../src/entities/Verifier';
import { config } from '../../src/config';
import { resetDb } from '../resetDb';
import { HolderApp } from '../../src/entities/HolderApp';
import { encrypt } from '@unumid/library-crypto';
import { EncryptedPresentation } from '../../src/services/PresentationServiceV2';
import { Issuer } from '../../src/entities/Issuer';
import { PresentationRequestPostDto } from '@unumid/types';

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

const mockReturnedRequest = {
  uuid: requestUuid,
  createdAt: now,
  updatedAt: now,
  expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
  verifier: {
    name: 'ACME, Inc. Verifier',
    did: mockReturnedVerifier.did,
    url: `${config.BASE_URL}/presentationV2?verifier=${mockReturnedVerifier.uuid}`
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

    beforeAll(async () => {
      // set up app and wait until server is ready
      app = await generateApp();
      server = app.listen();
      await new Promise((resolve) => server.once('listening', resolve));
    });

    afterAll(async () => {
      // wait until server is closed
      await new Promise(resolve => server.close(resolve));
    });

    beforeEach(async () => {
      // seed the db with a company
      // const companyOptions = {
      //   unumIdApiKey: '3n5jhT2vXDEEXlRj09oI9pP6DmWNXNCghUMC/ybK2Lw=',
      //   name: 'ACME, Inc.',
      //   unumIdCustomerUuid: '8125068d-e8c9-4706-83a0-be1485bf7265'
      // };
      const companyResponse = await supertest(app).post('/company').send(companyOptions);

      // set up mock responses from issuer and verifier apps
      // const now = new Date();

      mockReturnedHeaders = {
        'x-auth-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoidmVyaWZpZXIiLCJ1dWlkIjoiM2VjYzVlZDMtZjdhMC00OTU4LWJjOTgtYjc5NTQxMThmODUyIiwiZGlkIjoiZGlkOnVudW06ZWVhYmU0NGItNjcxMi00NTRkLWIzMWItNTM0NTg4NTlmMTFmIiwiZXhwIjoxNTk1NDcxNTc0LjQyMiwiaWF0IjoxNTk1NTI5NTExfQ.4iJn_a8fHnVsmegdR5uIsdCjXmyZ505x1nA8NVvTEBg'
      };

      // const mockReturnedVerifier = {
      //   uuid: uuidv4(),
      //   createdAt: now,
      //   updatedAt: now,
      //   did: `did:unum:${uuidv4()}`,
      //   customerUuid: companyOptions.unumIdCustomerUuid,
      //   name: 'ACME Inc. TEST Verifier',
      //   url: `${config.BASE_URL}/presentationV2`,
      //   keys: {
      //     signing: {
      //       privateKey: '-----BEGIN EC PRIVATE KEY-----MHcCAQEEIIFtwDWUzCbfeikEgD4m6G58hQo51d2Qz6bL11AHDMbDoAoGCCqGSM49AwEHoUQDQgAEwte3H5BXDcJy+4z4avMsNuqXFGYfL3ewcU0pe+UrYbhh6B7oCdvSPocO55BZO5pAOF/qxa/NhwixxqFf9eWVFg==-----END EC PRIVATE KEY-----'
      //     },
      //     encryption: {
      //       privateKey: '-----BEGIN PRIVATE KEY-----MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgm8wJE088DMBsevNbVumkWaD/pQeJMJ/ugoqp3fgSZaahRANCAAR0pYxqjkS76+HwdOFneQggtFSzkx32KwMVlRnUHh51s6adCEnQ1NeLI1pWl4+hVL9tBzshs72Oq1cW0q3hJ38m-----END PRIVATE KEY-----'
      //     }
      //   }
      // };

      // const mockReturnedIssuer = {
      //   uuid: uuidv4(),
      //   createdAt: now,
      //   updatedAt: now,
      //   did: `did:unum:${uuidv4()}`,
      //   customerUuid: companyOptions.unumIdCustomerUuid,
      //   name: 'ACME Inc. TEST Issuer',
      //   keys: {
      //     signing: {
      //       privateKey: '-----BEGIN EC PRIVATE KEY-----MHcCAQEEIIFtwDWUzCbfeikEgD4m6G58hQo51d2Qz6bL11AHDMbDoAoGCCqGSM49AwEHoUQDQgAEwte3H5BXDcJy+4z4avMsNuqXFGYfL3ewcU0pe+UrYbhh6B7oCdvSPocO55BZO5pAOF/qxa/NhwixxqFf9eWVFg==-----END EC PRIVATE KEY-----'
      //     }
      //   }
      // };

      // const mockReturnedHolderApp = {
      //   uuid: uuidv4(),
      //   createdAt: now,
      //   updatedAt: now,
      //   customerUuid: companyOptions.unumIdCustomerUuid,
      //   name: 'ACME Inc. TEST Holder App',
      //   uriScheme: 'acme://'
      // };

      // requestUuid = uuidv4();
      // const mockReturnedRequest = {
      //   uuid: requestUuid,
      //   createdAt: now,
      //   updatedAt: now,
      //   expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
      //   verifier: {
      //     name: 'ACME, Inc. Verifier',
      //     did: mockReturnedVerifier.did,
      //     url: `${config.BASE_URL}/presentationV2?verifier=${mockReturnedVerifier.uuid}`
      //   },
      //   credentialRequests: [
      //     {
      //       type: 'TestCredential',
      //       required: true,
      //       issuers: [
      //         {
      //           did: mockReturnedIssuer.did,
      //           name: 'ACME Inc. TEST Issuer',
      //           required: true
      //         }
      //       ]
      //     }
      //   ],
      //   proof: {
      //     created: now,
      //     signatureValue: '381yXYvTZfvdFgv9yRj8vTdQUXPi5w1HSm2QREFNgq3R1o7KbvDqiCcv62kGzkD2Kgq7pvW4WRaRqjV12v3zcxFLXbzGSi4z',
      //     type: 'secp256r1Signature2020',
      //     verificationMethod: mockReturnedVerifier.did,
      //     proofPurpose: 'AssertionMethod'
      //   },
      //   metadata: {},
      //   holderAppUuid: mockReturnedHolderApp.uuid
      // };

      // const mockPresentationRequestResponse = {
      //   presentationRequest: mockReturnedRequest,
      //   verifier: {
      //     name: 'ACME, Inc. Verifier',
      //     did: mockReturnedVerifier.did
      //   },
      //   issuers: {
      //     [mockReturnedIssuer.did]: {
      //       name: mockReturnedIssuer.name,
      //       did: mockReturnedIssuer.did
      //     }
      //   },
      //   deeplink: `acme:///unumid/presentationRequest/${requestUuid}`,
      //   qrCode: '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'
      // };

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
      const presentationRequestLocal = presentationRequestResponse.body;

      // const dummyVerifierDidWithHash = `${verifier.did}#${v4()}`;
      // const dummyPresentationRequestPostDto: PresentationRequestPostDto = {
      //   presentationRequest: {
      //     uuid: presentationRequestLocal.uuid,
      //     createdAt: now,
      //     updatedAt: now,
      //     expiresAt: now,
      //     verifier: verifier.did,
      //     credentialRequests: [{
      //       type: 'TestCredential',
      //       issuers: [mockReturnedIssuer.did]
      //     }],
      //     proof: {
      //       created: now.toISOString(),
      //       signatureValue: 'dummy signature value',
      //       unsignedValue: 'dummy unsigned value',
      //       type: 'secp256r1signature2020',
      //       verificationMethod: dummyVerifierDidWithHash,
      //       proofPurpose: 'assertionMethod'
      //     },
      //     metadata: { sessionUuid: dummySession.uuid },
      //     holderAppUuid: dummyHolderAppUuid
      //   },
      //   verifier: {
      //     name: dummyVerifierEntityOptions.verifierName,
      //     did: dummyVerifierDid,
      //     url: dummyVerifierEntityOptions.verifierUrl
      //   },
      //   issuers: {
      //     [dummyIssuerDid]: {
      //       did: dummyIssuerDid,
      //       name: 'test issuer'
      //     }
      //   },
      //   holderApp: dummyHolderAppInfo,
      //   deeplink: `acme://unumid/presentationRequest/${dummyPresentationRequestUuid}`,
      //   qrCode: 'data:image/png;base64,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'
      // };

      presentation = {
        '@context': [
          'https://www.w3.org/2018/credentials/v1'
        ],
        type: [
          'VerifiablePresentation'
        ],
        verifiableCredentials: [
          {
            '@context': [
              'https://www.w3.org/2018/credentials/v1'
            ],
            credentialStatus: {
              id: 'https://api.dev-unumid.org//credentialStatus/b2acd26a-ab18-4d18-9ad1-3b77f55c564b',
              type: 'CredentialStatus'
            },
            credentialSubject: {
              id: userOptions.did,
              test: 'test'
            },
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
        presentationRequestUuid: requestUuid,
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

      // const dummyPresentationRequestInfo = mockPresentationRequestResponse;

      // export const dummyEncryptedPresentationData = encrypt(dummyVerifierDid, rsaPublicKeyPem, dummyPresentation, 'pem');
      // export const dummyEncryptedPresentation = {
      //   presentationRequestInfo: dummyPresentationRequestInfo,
      //   encryptedPresentation: dummyEncryptedPresentationData
      // };

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
        await supertest(app).post('/presentationV2').send(encryptedPresentation);
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
          // credentialTypes: ['VerifiableCredential', 'TestCredential'],
          // credentials: presentation.verifiableCredential,
          presentation
        };

        (axios.post as jest.Mock).mockReturnValueOnce({ data: verifyReturnValue, headers: mockReturnedHeaders });
        const response = await supertest(app).post('/presentationV2').send(encryptedPresentation);
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
            }
          },
          presentationRequestUuid: mockPresentationRequestResponse.presentationRequest.uuid
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

        const sharedCredentialsResponse = await supertest(app).get('/sharedCredential').send();

        expect(sharedCredentialsResponse.body.length).toEqual(1);

        // convert dates to ISO string format
        // TODO: write a helper function to do this for any object
        const expected = {
          ...presentation.verifiableCredentials[0],
          issuanceDate: presentation.verifiableCredentials[0].issuanceDate.toISOString()
        };

        expect(sharedCredentialsResponse.body[0].credential).toEqual(expected);
      });

      describe('handling a NoPresentation', () => {
        let noPresentation: NoPresentation;
        let encryptedNoPresentationData;
        let encryptedNoPresentation;

        beforeEach(() => {
          noPresentation = {
            type: ['NoPresentation'],
            presentationRequestUuid: requestUuid,
            proof: {
              created: '2020-09-03T18:50:52.105Z',
              signatureValue: 'iKx1CJLYue7vopUo2fqGps3TWmxqRxoBDTupumLkaNp2W3UeAjwLUf5WxLRCRkDzEFeKCgT7JdF5fqbpvqnBZoHyYzWYbmW4YQ',
              type: 'secp256r1Signature2020',
              verificationMethod: 'did:unum:3ff2f020-50b0-4f4c-a267-a9f104aedcd8#1e126861-a51b-491f-9206-e2c6b8639fd1',
              proofPurpose: 'AssertionMethod'
            },
            holder: 'did:unum:3ff2f020-50b0-4f4c-a267-a9f104aedcd8'
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

          encryptedNoPresentationData = encrypt(mockReturnedVerifier.did, dummyRsaPublicKey1, noPresentation, 'pem');
          encryptedNoPresentation = {
            // presentationRequestUuid: presentation.presentationRequestUuid,
            presentationRequestInfo: mockPresentationRequestResponse,
            encryptedPresentation: encryptedPresentationData
          };
        });

        it('returns a success response if the NoPresentation is valid', async () => {
          const verifyReturnValue = {
            type: ['NoPresentation'],
            subject: noPresentation.proof.verificationMethod,
            isVerified: true,
            presentation
          };

          const expected = {
            isVerified: true,
            type: ['NoPresentation'],
            presentationReceiptInfo: {
              subjectDid: noPresentation.proof.verificationMethod.split('#')[0],
              verifierDid: verifier.did,
              holderApp: holderApp.uuid,
              credentialTypes: ['TestCredential']
            },
            presentationRequestUuid: mockPresentationRequestResponse.presentationRequest.uuid
          };

          (axios.post as jest.Mock).mockReturnValueOnce({ data: verifyReturnValue, headers: mockReturnedHeaders });
          const response = await supertest(app).post('/presentationV2').send(encryptedNoPresentation);
          expect(response.body).toEqual(expected);
        });

        it('returns a 400 status code if the NoPresentation is not verified', async () => {
          (axios.post as jest.Mock).mockReturnValueOnce({ data: { isVerified: false }, headers: mockReturnedHeaders });
          const response = await supertest(app).post('/presentationV2').send(encryptedNoPresentation);
          expect(response.status).toEqual(400);
        });
      });

      it('returns 400 status code if the Presentation is not verified', async () => {
        (axios.post as jest.Mock).mockReturnValueOnce({ data: { isVerified: false }, headers: mockReturnedHeaders });
        const response = await supertest(app).post('/presentationV2').send(encryptedPresentation);
        expect(response.status).toEqual(400);
      });
    });
  });
});
