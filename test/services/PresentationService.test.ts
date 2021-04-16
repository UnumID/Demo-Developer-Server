import generateApp from '../../src/generate-app';

describe('PresentationDataService', () => {
  describe('initializing the service', () => {
    it('registers with the app', async () => {
      const app = await generateApp();
      const service = app.service('presentation');
      expect(service).toBeDefined();
    });
  });
});
