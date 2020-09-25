import { Entity, Property, ManyToOne } from 'mikro-orm';

import { BaseEntity, BaseEntityOptions } from './BaseEntity';
import { Credential } from '../types';
import { User } from './User';
import { Issuer } from './Issuer';
import { Verifier } from './Verifier';

export interface SharedCredentialOptions extends BaseEntityOptions {
  userUuid: string;
  issuerUuid: string;
  verifierUuid: string;
  credential: Credential;
}

@Entity()
export class SharedCredential extends BaseEntity {
  @ManyToOne(() => User)
  userUuid: string;

  @ManyToOne(() => Issuer)
  issuerUuid: string;

  @ManyToOne(() => Verifier)
  verifierUuid: string;

  @Property({ columnType: 'jsonb' })
  credential: Credential;

  constructor (options: SharedCredentialOptions) {
    super(options);

    const {
      userUuid,
      issuerUuid,
      verifierUuid,
      credential
    } = options;

    this.userUuid = userUuid;
    this.issuerUuid = issuerUuid;
    this.verifierUuid = verifierUuid;
    this.credential = credential;
  }
}
