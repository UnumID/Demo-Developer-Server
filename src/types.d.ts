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
