import { Application as ExpressFeathers } from '@feathersjs/express';
import { MikroORM, EntityManager } from 'mikro-orm';

// A mapping of service names to types. Will be extended in service files.
export interface ServiceTypes {} // eslint-disable-line @typescript-eslint/no-empty-interface

export interface Mikro {
  orm: MikroORM;
  em: EntityManager;
}

// The application instance type that will be used everywhere else
export type MikroExpressFeathers<T> = ExpressFeathers<T> & { mikro?: Mikro };
export type Application = MikroExpressFeathers<ServiceTypes>;
