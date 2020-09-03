import { Application as ExpressFeathers } from '@feathersjs/express';
import { MikroORM, EntityManager, EntityRepository } from 'mikro-orm';
import { Company } from './entities/Company';
import { Issuer } from './entities/Issuer';
import { User } from './entities/User';
import { IssuedCredential } from './entities/IssuedCredential';
import { Verifier } from './entities/Verifier';

// A mapping of service names to types. Will be extended in service files.
export interface ServiceTypes {} // eslint-disable-line @typescript-eslint/no-empty-interface

export interface Mikro {
  orm: MikroORM;
  em: EntityManager;
  companyRepository: EntityRepository<Company>;
  issuerRepository: EntityRepository<Issuer>;
  userRepository: EntityRepository<User>;
  issuedCredentialRepository: EntityRepository<IssuedCredential>
  verifierRepository: EntityRepository<Verifier>
}

// The application instance type that will be used everywhere else
export type MikroExpressFeathers<T> = ExpressFeathers<T> & { mikro?: Mikro };
export type Application = MikroExpressFeathers<ServiceTypes>;
