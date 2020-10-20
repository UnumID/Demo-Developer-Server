export interface Proof {
  created: string;
  signatureValue: string;
  type: string;
  verificationMethod: string;
  proofPurpose: string;
}

export interface Credential {
  '@context': ['https://www.w3.org/2018/credentials/v1', ...string[]];
  credentialStatus: {
    id: string;
    type: string;
  };
  credentialSubject: {
    id: string,
    [key: string]: unknown
  };
  issuer: string;
  type: ['VerifiableCredential', ...string[]];
  id: string;
  issuanceDate: Date;
  expirationDate?: Date;
  proof: Proof;
}

export interface Presentation {
  '@context': ['https://www.w3.org/2018/credentials/v1', ...string[]];
  type: ['VerifiablePresentation', ...string[]];
  verifiableCredential: Credential[];
  presentationRequestUuid: string;
  proof: Proof
}

export interface NoPresentation {
  type: ['NoPresentation' | 'Declination' | 'Report', ...string[]];
  holder: string;
  proof: Proof;
  presentationRequestUuid: string;
}

export type PresentationOrNoPresentation = Presentation | NoPresentation;

export interface VerifierInfo {
  name: string;
  url: string;
  did: string;
}

export interface IssuerInfo {
  name: string;
  did: string;
}

export interface IssuerInfoMap {
  [did: string]: IssuerInfo;
}
