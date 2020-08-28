import { Entity, Property, ManyToOne } from 'mikro-orm';

import { BaseEntity, BaseEntityOptions } from './BaseEntity';
import { Credential } from '../types';
import { User } from './User';
import { Issuer } from './Issuer';

export interface IssuedCredentialOptions extends BaseEntityOptions {
  userUuid: string;
  issuerUuid: string;
  credential: Credential;
}

@Entity()
export class IssuedCredential extends BaseEntity {
  @ManyToOne(() => User)
  userUuid: string;

  @ManyToOne(() => Issuer)
  issuerUuid: string;

  @Property({ columnType: 'jsonb' })
  credential: Credential;

  constructor (options: IssuedCredentialOptions) {
    super(options);

    const {
      userUuid,
      issuerUuid,
      credential
    } = options;

    this.userUuid = userUuid;
    this.issuerUuid = issuerUuid;
    this.credential = credential;
  }
}
