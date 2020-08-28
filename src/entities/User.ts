import { Entity, Property, ManyToOne } from 'mikro-orm';

import { BaseEntity, BaseEntityOptions } from './BaseEntity';
import { Company } from './Company';

export interface UserOptions extends BaseEntityOptions {
  name: string;
  companyUuid: string;
  did?: string;
}

@Entity()
export class User extends BaseEntity {
  @Property()
  name?: string;

  @Property({ nullable: true })
  did?: string;

  @ManyToOne(() => Company)
  companyUuid: string;

  constructor (options: UserOptions) {
    super(options);
    const { name, companyUuid, did } = options;

    this.name = name;
    this.companyUuid = companyUuid;
    this.did = did;
  }
}
