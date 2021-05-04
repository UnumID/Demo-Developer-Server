import { Server } from 'http';
import { HookContext } from '@feathersjs/feathers';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import supertest from 'supertest';

import generateApp from '../../src/generate-app';
import { registerHolderApp } from '../../src/services/HolderAppService';
import { Application } from '../../src/declarations';
import { HolderApp } from '../../src/entities/HolderApp';
import { resetDb } from '../resetDb';

jest.mock('axios');
const mockAxiosPost = axios.post as jest.Mock;
describe('HolderAppService', () => {
  const now = new Date();
  const dummyCompany = {
    uuid: uuidv4(),
    unumIdApiKey: '3n5jhT2vXDEEXlRj09oI9pP6DmWNXNCghUMC/ybK2Lw=',
    name: 'ACME, Inc.',
    unumIdCustomerUuid: '8125068d-e8c9-4706-83a0-be1485bf7265',
    createdAt: now,
    updatedAt: now
  };

  const mockGet = jest.fn(() => [dummyCompany]);
  const mockService = jest.fn(() => ({ get: mockGet }));
  const ctx = {
    app: {
      service: mockService
    },
    data: {
      name: 'ACME, Inc. Holder App',
      uriScheme: 'acme://',
      companyUuid: dummyCompany.uuid,
      apiKey: 'J6A5J3FEJXi+2Xh6JUWpXl5+318dfi1kcwxnMMQKrfc='
    },
    params: {
      headers: {
        version: '1.0.0'
      }
    }
  } as unknown as HookContext;

  const mockReturnedHolderApp = {
    uuid: uuidv4(),
    createdAt: now,
    updatedAt: now,
    customerUuid: dummyCompany.unumIdCustomerUuid,
    name: 'ACME, Inc. Holder App',
    uriScheme: 'acme://'
  };
  mockAxiosPost.mockReturnValue({ data: mockReturnedHolderApp });

  describe('initializing the service', () => {
    it('registers with the app', async () => {
      const app = await generateApp();
      const service = app.service('holderApp');
      expect(service).toBeDefined();
    });
  });

  describe('hooks', () => {
    describe('registerHolderApp', () => {
      it('gets the company', async () => {
        await registerHolderApp(ctx);
        expect(mockService).toBeCalledWith('company');
        expect(mockGet).toBeCalled();
      });

      it('returns a new context with values from the saas', async () => {
        const newCtx = await registerHolderApp(ctx);
        const newData = newCtx.data;
        expect(newData.uuid).toEqual(mockReturnedHolderApp.uuid);
      });
    });
  });

  describe('/holderApp endpoint', () => {
    let server: Server;
    let app: Application;
    let holderApp: HolderApp;

    beforeAll(async () => {
      app = await generateApp();
      server = app.listen();
      await new Promise((resolve) => server.once('listening', resolve));
      const companyOptions = {
        unumIdApiKey: '3n5jhT2vXDEEXlRj09oI9pP6DmWNXNCghUMC/ybK2Lw=',
        name: 'ACME, Inc.',
        unumIdCustomerUuid: '8125068d-e8c9-4706-83a0-be1485bf7265'
      };
      const companyResponse = await supertest(app).post('/company').send(companyOptions);

      const options = {
        name: 'ACME, Inc. Holder App',
        uriScheme: 'acme://',
        companyUuid: companyResponse.body.uuid,
        apiKey: 'J6A5J3FEJXi+2Xh6JUWpXl5+318dfi1kcwxnMMQKrfc='
      };

      const holderAppResponse = await supertest(app).post('/holderApp').send(options);

      holderApp = holderAppResponse.body;
    });

    afterAll(async () => {
      await resetDb(app.mikro.em);
      await new Promise(resolve => server.close(resolve));
    });

    it('saves the holderApp in the database', async () => {
      const found = await supertest(app).get(`/holderApp/${holderApp.uuid}`);
      expect(found.body).toEqual(holderApp);
    });
  });
});
