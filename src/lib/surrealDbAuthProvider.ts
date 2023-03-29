import jwt_decode from 'jwt-decode';
import { type AuthProvider, type UserIdentity } from 'react-admin';
import { type JWTInterface, type RaSurrealDbAuth, type RaSurrealDbAuthProviderOptions } from '.';

interface LoginPayload {
  username: string;
  password: string;
}

export const surrealDbAuthProvider = (rasurreal: RaSurrealDbAuthProviderOptions): AuthProvider => {
  const { surrealdb, signinOptions, localStorageKey, getIdentity, getPermissions, ensureConnexion } =
    rasurreal;

  const getAuth = (): RaSurrealDbAuth | undefined => {
    if (localStorageKey !== undefined) {
      const authString = localStorage.getItem(localStorageKey);
      return authString !== null && JSON.parse(authString);
    } else {
      return rasurreal.auth;
    }
  };

  return {
    login: async ({ username, password }: LoginPayload) => {
      const jwt = await surrealdb.signin({ ...signinOptions, user: username, pass: password });
      if (jwt !== '') {
        const jwtDecoded = jwt_decode<JWTInterface>(jwt);
        const auth: RaSurrealDbAuth = {
          jwt,
          id: jwtDecoded.ID,
          exp: jwtDecoded.exp * 1000,
        };
        if (localStorageKey !== undefined) {
          localStorage.setItem(localStorageKey, JSON.stringify(auth));
        }
        rasurreal.auth = auth;
      }
      return surrealdb;
    },
    checkError: async (error) => {
      console.error(error); // eslint-disable-line no-console
    },
    checkAuth: async (params) => {
      const auth = getAuth();
      if (auth === undefined) throw new Error('no auth');
      const { exp } = auth;
      if (exp < Date.now()) throw new Error('session expired');
    },
    logout: async () => {
      rasurreal.auth = undefined;
      localStorageKey !== undefined && localStorage.removeItem(localStorageKey);
      await surrealdb.invalidate();
    },
    getIdentity: async (): Promise<UserIdentity> => {
      const auth = getAuth();
      if (auth === undefined) throw new Error('No identity');
      return getIdentity !== undefined ? await getIdentity(auth.id, surrealdb) : { id: auth.id };
    },
    handleCallback: async () => {
      await Promise.resolve(/* ... */);
    },
    getPermissions: async (param): Promise<any> => {
      if (getPermissions !== undefined) {
        const auth = getAuth();
        return await (auth != null &&
          getPermissions(auth?.id, await ensureConnexion(rasurreal), param));
      }
      return undefined;
    },
  };
};
