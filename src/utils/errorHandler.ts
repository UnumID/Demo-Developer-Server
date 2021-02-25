import { BadRequest } from '@feathersjs/errors';
import { CustError } from '@unumid/server-sdk';

export const handleError = (error: CustError): void => {
  if (error.code === 400 && error.message) {
    throw new BadRequest(error.message);
  }
};
