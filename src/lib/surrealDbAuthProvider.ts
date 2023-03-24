import jwt_decode from 'jwt-decode';
import { type AuthProvider, type UserIdentity } from 'react-admin';
import { type JWTInterface, type RaSurrealDb, type RaSurrealDbAuth } from '.';

interface LoginPayload {
  username: string;
  password: string;
}

export const surrealDbAuthProvider = (rasurreal: RaSurrealDb): AuthProvider => {
  const { surrealdb, signinOptions, localStorage: localStorageKey } = rasurreal;

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
      let auth: RaSurrealDbAuth | undefined;
      if (localStorageKey !== undefined) {
        const authString = localStorage.getItem(localStorageKey);
        auth = authString !== null && JSON.parse(authString);
      } else {
        auth = rasurreal.auth;
      }
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
      let auth: RaSurrealDbAuth | undefined;
      if (localStorageKey !== undefined) {
        const authString = localStorage.getItem(localStorageKey);
        auth = authString !== null && JSON.parse(authString);
      } else {
        auth = rasurreal.auth;
      }
      if (auth === undefined) throw new Error('No identity');
      return { id: auth.id };
    },
    handleCallback: async () => {
      await Promise.resolve(/* ... */);
    },
    // Not implemented. No standard way to implement thems.
    getPermissions: async () => {
      await Promise.resolve(/* ... */);
    },
  };
};
