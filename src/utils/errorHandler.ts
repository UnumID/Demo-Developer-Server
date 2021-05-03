import { BadRequest } from '@feathersjs/errors';
import { CustError } from '@unumid/server-sdk';
import { Response } from 'express';

// /**
//  * Class to encapsulate http errors.
//  */
// export class HttpError extends Error {
//   status: number;
//   message: string;

//   constructor (status: number, message: string) {
//     super(message);
//     this.status = status;
//     this.message = message;

//     // see: typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html
//     Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
//     this.name = HttpError.name; // stack traces display correctly now
//   }
// }

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
