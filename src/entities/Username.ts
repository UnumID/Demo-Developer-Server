import { Entity, Property } from 'mikro-orm';

import { BaseEntity, BaseEntityOptions } from './BaseEntity';

export interface UsernameOptions extends BaseEntityOptions {
  username: string;
}

@Entity()
export class Username extends BaseEntity {
  @Property({ unique: true, index: true })
  username: string;

  constructor (options: UsernameOptions) {
    super(options);

    this.username = options.username;
  }
}
