import { Entity, Property, ManyToOne } from 'mikro-orm';

import { BaseEntity } from './BaseEntity';
import { Company } from './Company';

export interface HolderAppEntityOptions {
  uuid: string;
  uriScheme: string;
  apiKey: string;
  name: string;
  company: Company;
}

@Entity()
export class HolderApp extends BaseEntity {
  @Property()
  uriScheme: string;

  @Property()
  apiKey: string;

  @Property()
  name: string;

  @ManyToOne(() => Company)
  company: Company;

  constructor (options: HolderAppEntityOptions) {
    super(options);

    this.uriScheme = options.uriScheme;
    this.apiKey = options.apiKey;
    this.name = options.name;
    this.company = options.company;
  }
}
