import { BadRequest } from '@feathersjs/errors';
import { CustError } from '@unumid/server-sdk';

export const handleError = (error: CustError): void => {
  if (error.code === 400 && error.message) {
    throw new BadRequest(error.message);
  }
};

export const handleIssuerVerifierWebAppError = (errorResponse: any): void => {
  const data = errorResponse?.data;
  const status = errorResponse?.status;
  if (data) {
    if (data.name === 'CryptoError' && data.code) {
      throw new BadRequest(`CryptoError: ${data.code}`);
    } else if (status === 400) {
      throw new BadRequest(`${data}`);
    }
  }
};
