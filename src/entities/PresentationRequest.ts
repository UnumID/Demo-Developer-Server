import { Entity, Property, ManyToOne } from 'mikro-orm';

import { BaseEntity, BaseEntityOptions } from './BaseEntity';
import {
  Proof,
  VerifierInfo,
  IssuerInfoMap
} from '@unumid/types';
import { Verifier } from './Verifier';
import { HolderApp } from './HolderApp';

export interface CredentialRequest {
  type: string; // the type of credential being requested
  issuers: string[]; // a list of DIDs of issuers of the requested credentials
  required?: boolean; // indicates if the response must fulfill this Credential
}

export interface PresentationRequestOptions extends BaseEntityOptions {
  verifier: Verifier;
  credentialRequests: CredentialRequest[];
  proof: Proof;
  metadata?: Record<string, unknown>;
  holderApp: HolderApp;
  verifierInfo: VerifierInfo;
  issuers: IssuerInfoMap;
  deeplink: string;
  qrCode: string;
  data: any;
}

@Entity()
export class PresentationRequest extends BaseEntity {
  @Property({ persist: false })
  get verifier (): string {
    return this._verifier.did;
  }

  @Property()
  credentialRequests: CredentialRequest[];

  @Property({ columnType: 'jsonb' })
  proof: Proof;

  @Property({ columnType: 'jsonb' })
  metadata?: Record<string, unknown>;

  @ManyToOne(() => Verifier, { joinColumn: 'verifierUuid' })
  _verifier: Verifier

  @ManyToOne(() => HolderApp, { joinColumn: 'holderAppUuid' })
  holderApp: HolderApp

  @Property({ columnType: 'jsonb' })
  verifierInfo: VerifierInfo;

  @Property({ columnType: 'jsonb' })
  issuers: IssuerInfoMap;

  @Property({ columnType: 'jsonb' })
  deeplink: string;

  @Property({ columnType: 'text' })
  qrCode: string;

  @Property({ columnType: 'jsonb' })
  data: any;

  constructor (options: PresentationRequestOptions) {
    super(options);

    this._verifier = options.verifier;
    this.credentialRequests = options.credentialRequests;
    this.proof = options.proof;
    this.metadata = options.metadata;
    this.holderApp = options.holderApp;
    this.verifierInfo = options.verifierInfo;
    this.issuers = options.issuers;
    this.deeplink = options.deeplink;
    this.qrCode = options.qrCode;
    this.data = options.data;
  }
}
