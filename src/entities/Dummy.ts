import { Entity } from 'mikro-orm';

import { BaseEntity } from './BaseEntity';

@Entity()
export class Dummy extends BaseEntity {}
