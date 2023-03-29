import jwt_decode from 'jwt-decode';
import { useMemo } from 'react';
import { type Identifier, type UserIdentity } from 'react-admin';
import Surreal, { type Auth, type DatabaseAuth } from 'surrealdb.js';

export { surrealDbAuthProvider } from './surrealDbAuthProvider';
export { surrealDbDataProvider } from './surrealDbDataProvider';

interface EnsureConnexionOption {
  surrealdb: Surreal;
  localStorageKey?: string;
  auth?: RaSurrealDbAuth;
}

export interface RaSurrealDb extends EnsureConnexionOption {
  ensureConnexion: (options: EnsureConnexionOption) => Promise<Surreal>;
}

type IdentityFunction = (id: Identifier, db: Surreal) => Promise<UserIdentity>;
type PermissionFunction = (id: Identifier, db: Surreal, params: any) => Promise<any>;
export interface RaSurrealDbAuthProviderOptions extends RaSurrealDb {
  signinOptions: Auth;
  getIdentity?: IdentityFunction;
  getPermissions?: PermissionFunction;
}

interface RaSurrealDbOption
  extends Pick<
    RaSurrealDbAuthProviderOptions,
    'signinOptions' | 'localStorageKey' | 'getIdentity' | 'getPermissions'
  > {
  url: string;
}

export interface RaSurrealDbAuth {
  jwt: string;
  exp: number;
  id: string;
}
export interface JWTInterface {
  ID: string;
  exp: number;
}

export const useRaSurrealDb = ({
  url,
  signinOptions,
  localStorageKey,
  getIdentity,
  getPermissions,
}: RaSurrealDbOption): RaSurrealDbAuthProviderOptions =>
  useMemo(() => {
    const surrealdb = new Surreal(url);

    return {
      surrealdb,
      signinOptions,
      localStorageKey,
      getIdentity,
      getPermissions,
      ensureConnexion: async (options: EnsureConnexionOption): Promise<Surreal> => {
        if (options.auth === undefined && signinOptions.user !== undefined) {
          const jwt = await surrealdb.signin(signinOptions);
          const jwtDecoded = jwt_decode<JWTInterface>(jwt);
          options.auth = {
            jwt,
            id: jwtDecoded.ID,
            exp: jwtDecoded.exp * 1000,
          };

          await surrealdb.use(
            (signinOptions as DatabaseAuth).NS ?? 'test',
            (signinOptions as DatabaseAuth).DB ?? 'test'
          );
        } else if (options.localStorageKey !== undefined && options.auth?.jwt === undefined) {
          const authString = localStorage.getItem(options.localStorageKey);
          const auth: RaSurrealDbAuth | undefined = authString !== null && JSON.parse(authString);
          try {
            auth?.jwt !== undefined && (await surrealdb.authenticate(auth.jwt));
            options.auth = auth;
          } catch (e: any) {
            if (e.name === 'AuthenticationError') {
              localStorage.removeItem(options.localStorageKey);
              throw new Error('no auth');
            }
            throw e;
          }
          await surrealdb.use(
            (signinOptions as DatabaseAuth).NS ?? 'test',
            (signinOptions as DatabaseAuth).DB ?? 'test'
          );
        }
        return surrealdb;
      },
    };
  }, [url, signinOptions, localStorage, getIdentity, getPermissions]);
