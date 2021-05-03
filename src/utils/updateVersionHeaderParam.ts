import { Params } from '@feathersjs/feathers';

export const updateVersionHeaderParam = (params: Params, version: string): Params => {
  const newParams: Params = {
    ...params,
    headers: {
      ...params.headers,
      version
    }
  };

  return newParams;
};
