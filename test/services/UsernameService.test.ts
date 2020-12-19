import generateApp from '../../src/generate-app';

describe('User service', () => {
  describe('initializing the service', () => {
    it('registers with the app', async () => {
      const app = await generateApp();
      const service = app.service('username');
      expect(service).toBeDefined();
    });
  });

  // TODO: add test cases for the unique username generation
});
