import dotenv from 'dotenv';

dotenv.config();

interface Config {
  DB_NAME: string;
  DB_PORT: number;
  DB_HOST: string;
  DB_PASSWORD: string;
  DB_USER: string;
  ISSUER_URL: string;
  VERIFIER_URL: string;
  BASE_URL: string;
  PAPERTRAIL_PORT: number;
  NODE_ENV: string;
}

const {
  DB_NAME,
  DB_PORT,
  DB_USER,
  DB_HOST,
  DB_PASSWORD,
  NODE_ENV,
  TEST_DB_NAME,
  TEST_DB_PORT,
  TEST_DB_USER,
  TEST_DB_HOST,
  TEST_DB_PASSWORD,
  ISSUER_URL,
  VERIFIER_URL,
  BASE_URL,
  PAPERTRAIL_PORT
} = process.env;

function ensureString (stringOrUndefined: string | undefined, defaultValue = ''): string {
  return stringOrUndefined || defaultValue;
}

export const isTest = function isTest (): boolean {
  return NODE_ENV === 'test';
};

export const config: Config = {
  DB_NAME: ensureString(isTest() ? TEST_DB_NAME : DB_NAME),
  DB_PORT: parseInt(ensureString(isTest() ? TEST_DB_PORT : DB_PORT, '5432'), 10),
  DB_USER: ensureString(isTest() ? TEST_DB_USER : DB_USER),
  DB_HOST: ensureString(isTest() ? TEST_DB_HOST : DB_HOST, 'localhost'),
  DB_PASSWORD: ensureString(isTest() ? TEST_DB_PASSWORD : DB_PASSWORD),
  ISSUER_URL: ensureString(ISSUER_URL),
  VERIFIER_URL: ensureString(VERIFIER_URL),
  BASE_URL: ensureString(BASE_URL, 'http://localhost:3031'),
  PAPERTRAIL_PORT: parseInt(ensureString(PAPERTRAIL_PORT), 10),
  NODE_ENV: ensureString(NODE_ENV, 'development')
};
