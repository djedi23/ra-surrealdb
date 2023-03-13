import { useMemo } from 'react';
import Surreal, { Auth } from 'surrealdb.js';

export { surrealDbDataProvider } from './surrealDbDataProvider';
export { surrealDbAuthProvider } from './surrealDbAuthProvider';

export interface RaSurrealDb {
  surrealdb_js: Surreal;
  signinOptions: Partial<Auth>;
  auth?: {
    jwt: string;
    exp: number;
    id: string;
  };
}

interface RaSurrealDbOption {
  url: string;
  signinOptions: Partial<Auth>;
}

export const useRaSurrealDb = ({ url, signinOptions }: RaSurrealDbOption): RaSurrealDb =>
  useMemo(
    () => ({
      surrealdb_js: new Surreal(url),
      signinOptions,
    }),
    [url, signinOptions]
  );
