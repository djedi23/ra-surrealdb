import { useMemo } from 'react';
import Surreal, { type Auth } from 'surrealdb.js';

export { surrealDbDataProvider } from './surrealDbDataProvider';
export { surrealDbAuthProvider } from './surrealDbAuthProvider';

export interface RaSurrealDb {
  surrealdb: Surreal;
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

export interface JWTInterface {
  ID: string;
  exp: number;
}

export const useRaSurrealDb = ({
  url,
  signinOptions,
  localStorage,
}: RaSurrealDbOption): RaSurrealDb =>
  useMemo(
    () => ({
      surrealdb: new Surreal(url),
      signinOptions,
      localStorage,
    }),
    [url, signinOptions, localStorage]
  );
