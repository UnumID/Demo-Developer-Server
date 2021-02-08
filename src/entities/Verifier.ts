import { Entity, Property, ManyToOne } from 'mikro-orm';

import { BaseEntity, BaseEntityOptions } from './BaseEntity';
import { Company } from './Company';
import { config } from '../config';

export interface VerifierOptions extends BaseEntityOptions {
  name: string;
  did: string;
  privateKey: string;
  encryptionPrivateKey: string;
  authToken: string;
  companyUuid: string;
}

@Entity()
export class Verifier extends BaseEntity {
  @Property()
  did: string;

  @Property({ columnType: 'text' })
  privateKey: string;

  @Property({ columnType: 'text' })
  encryptionPrivateKey: string;

  @Property({ columnType: 'text' })
  authToken: string;

  @Property()
  name: string;

  @ManyToOne(() => Company)
  companyUuid: string;

  @Property()
  url: string;

  constructor (options: VerifierOptions) {
    super(options);
    const {
      name,
      did,
      privateKey,
      encryptionPrivateKey,
      authToken,
      companyUuid
    } = options;

    this.did = did;
    this.privateKey = privateKey;
    this.encryptionPrivateKey = encryptionPrivateKey;
    this.authToken = authToken;
    this.name = name;
    this.companyUuid = companyUuid;
    this.url = `${config.BASE_URL}/presentation`;
  }
}
