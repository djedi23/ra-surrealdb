import { useMemo } from 'react';
import Surreal, { Auth } from 'surrealdb.js';

export { surrealDbDataProvider } from './surrealDbDataProvider';
export { surrealDbAuthProvider } from './surrealDbAuthProvider';

export interface RaSurrealDb {
  surrealdb_js: Surreal;
  signinOptions: Partial<Auth>;
  auth?: RaSurrealDbAuth;
  localStorage?: string;
}

export interface RaSurrealDbAuth {
  jwt: string;
  exp: number;
  id: string;
}

interface RaSurrealDbOption {
  url: string;
  signinOptions: Partial<Auth>;
  localStorage?: string;
}

export const useRaSurrealDb = ({
  url,
  signinOptions,
  localStorage,
}: RaSurrealDbOption): RaSurrealDb =>
  useMemo(
    () => ({
      surrealdb_js: new Surreal(url),
      signinOptions,
      localStorage,
    }),
    [url, signinOptions, localStorage]
  );
