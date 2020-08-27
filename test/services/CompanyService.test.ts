import generateApp from '../../src/generate-app';

describe('Company service', () => {
  describe('initializing the service', () => {
    it('registers with the app', async () => {
      const app = await generateApp();
      const service = app.service('company');
      expect(service).toBeDefined();
    });
  });
});
