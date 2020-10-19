import { UuidEntity, PrimaryKey, Property } from 'mikro-orm';
import { v4 as uuidv4 } from 'uuid';

export interface BaseEntityOptions {
  uuid?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export abstract class BaseEntity implements UuidEntity<BaseEntity> {
  @PrimaryKey({ type: 'uuid' })
  uuid!: string;

  @Property({ columnType: 'timestamptz(6)' })
  createdAt: Date;

  @Property({ onUpdate: () => new Date(), columnType: 'timestamptz(6)' })
  updatedAt: Date;

  constructor (options: BaseEntityOptions = {}) {
    this.uuid = options.uuid || uuidv4();
    this.createdAt = options.createdAt || new Date();
    this.updatedAt = options.updatedAt || new Date();
  }
}
