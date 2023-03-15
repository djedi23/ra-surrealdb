import jwt_decode from 'jwt-decode';
import { AuthProvider, UserIdentity } from 'react-admin';
import { RaSurrealDb, RaSurrealDbAuth } from '.';

interface LoginPayload {
  username: string;
  password: string;
}

export const surrealDbAuthProvider = (rasurreal: RaSurrealDb): AuthProvider => {
  const { surrealdb_js, signinOptions, localStorage: localStorageKey } = rasurreal;

  return {
    login: async ({ username, password }: LoginPayload) => {
      const jwt = await surrealdb_js.signin({ ...signinOptions, user: username, pass: password });
      if (jwt) {
        const jwt_decoded = jwt_decode(jwt) as { ID: string; exp: number };
        const auth: RaSurrealDbAuth = {
          jwt,
          id: jwt_decoded.ID,
          exp: jwt_decoded.exp * 1000,
        };
        if (localStorageKey) {
          localStorage.setItem(localStorageKey, JSON.stringify(auth));
        }
        rasurreal.auth = auth;
      }
      return surrealdb_js;
    },
    checkError: async (error) => {
      console.error(error);
    },
    checkAuth: async (params) => {
      let auth: RaSurrealDbAuth | undefined;
      if (localStorageKey) {
        const auth_string = localStorage.getItem(localStorageKey);
        auth = auth_string && JSON.parse(auth_string);
      } else {
        auth = rasurreal.auth;
      }
      if (auth === undefined) throw 'no auth';
      const { exp } = auth;
      if (exp && exp < Date.now()) throw 'session expired';
    },
    logout: async () => {
      rasurreal.auth = undefined;
      localStorageKey && localStorage.removeItem(localStorageKey);
      return surrealdb_js.invalidate();
    },
    getIdentity: async (): Promise<UserIdentity> => {
      let auth: RaSurrealDbAuth | undefined;
      if (localStorageKey) {
        const auth_string = localStorage.getItem(localStorageKey);
        auth = auth_string && JSON.parse(auth_string);
      } else {
        auth = rasurreal.auth;
      }
      if (auth === undefined) throw 'No identity';
      return { id: auth.id };
    },
    handleCallback: () => Promise.resolve(/* ... */),
    // Not implemented. No standard way to implement thems.
    getPermissions: () => Promise.resolve(/* ... */),
  };
};
