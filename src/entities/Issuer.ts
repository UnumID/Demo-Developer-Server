import { Entity, Property, ManyToOne } from 'mikro-orm';

import { BaseEntity, BaseEntityOptions } from './BaseEntity';
import { Company } from './Company';

export interface IssuerOptions extends BaseEntityOptions {
  name: string;
  did: string;
  privateKey: string;
  authToken: string;
  uriScheme: string;
  companyUuid: string;
}

@Entity()
export class Issuer extends BaseEntity {
  @Property()
  did: string;

  @Property({ columnType: 'text' })
  privateKey: string;

  @Property({ columnType: 'text' })
  authToken: string;

  @Property()
  uriScheme: string;

  @Property()
  name: string;

  @ManyToOne(() => Company)
  companyUuid: string;

  constructor (options: IssuerOptions) {
    super(options);
    const {
      name,
      did,
      privateKey,
      authToken,
      uriScheme,
      companyUuid
    } = options;

    this.did = did;
    this.privateKey = privateKey;
    this.authToken = authToken;
    this.uriScheme = uriScheme;
    this.name = name;
    this.companyUuid = companyUuid;
  }
}
