import dotenv from 'dotenv';

dotenv.config();

interface Config {
  DB_NAME: string;
  DB_PORT: number;
  DB_HOST: string;
  DB_PASSWORD: string;
  DB_USER: string;
}

const {
  DB_NAME,
  DB_PORT,
  DB_USER,
  DB_HOST,
  DB_PASSWORD
} = process.env;

function ensureString (stringOrUndefined: string | undefined, defaultValue = ''): string {
  return stringOrUndefined || defaultValue;
}

export const config: Config = {
  DB_NAME: ensureString(DB_NAME),
  DB_PORT: parseInt(ensureString(DB_PORT, '5432'), 10),
  DB_USER: ensureString(DB_USER),
  DB_HOST: ensureString(DB_HOST, 'localhost'),
  DB_PASSWORD: ensureString(DB_PASSWORD)
};
