import { Entity, Property } from 'mikro-orm';

import { BaseEntity, BaseEntityOptions } from './BaseEntity';

export interface CompanyOptions extends BaseEntityOptions {
  unumIdApiKey: string;
  unumIdCustomerUuid: string;
  name: string;
}

@Entity()
export class Company extends BaseEntity {
  @Property()
  unumIdApiKey: string;

  @Property({ columnType: 'uuid' })
  unumIdCustomerUuid: string;

  @Property()
  name: string;

  constructor (options: CompanyOptions) {
    super(options);
    const { unumIdApiKey, unumIdCustomerUuid, name } = options;

    this.unumIdApiKey = unumIdApiKey;
    this.unumIdCustomerUuid = unumIdCustomerUuid;
    this.name = name;
  }
}
