import { ServiceAddons, Params, ServiceOverloads } from '@feathersjs/feathers';
import { AuthenticationService, AuthenticationBaseStrategy } from '@feathersjs/authentication';
import { NotAuthenticated } from '@feathersjs/errors';
import { User } from './entities/User';
import { MikroOrmService } from 'feathers-mikro-orm';
import { Application } from './declarations';

class UserStrategy extends AuthenticationBaseStrategy {
  get configuration (): any {
    const authConfig = this.authentication?.configuration;
    const config = super.configuration || {};

    return {
      service: authConfig.service,
      entity: authConfig.entity,
      entityId: authConfig.entityId,
      errorMessage: 'Invalid username',
      ...config
    };
  }

  async getEntity (result: any, params: Params): Promise<any> {
    const { entityService, configuration: { entityId, entity } } = this;

    if (!entityId || result[entityId] === undefined) {
      throw new NotAuthenticated('Could not get local entity');
    }

    if (!params.provider) {
      return result;
    }

    const service = entityService as MikroOrmService & ServiceAddons<MikroOrmService> & ServiceOverloads<MikroOrmService>;
    return service.get(null, { where: { name: result[entityId] } });
  }

  async authenticate (data: { strategy: 'session', user: User }, params: Params): Promise<any> {
    const { entity } = this.configuration;
    return {
      authentication: { strategy: this.name },
      data,
      [entity]: await this.getEntity(data, params)
    };
  }
}

declare module './declarations' {
  interface ServiceTypes {
    authentication: AuthenticationService & ServiceAddons<unknown>;
  }
}

export default function (app: Application): void {
  const userAuthentication = new AuthenticationService(app, 'userAuthentication');

  userAuthentication.register('user', new UserStrategy());

  app.use('/userAuthentication', userAuthentication);
}
