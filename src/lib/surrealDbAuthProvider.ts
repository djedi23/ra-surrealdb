import jwt_decode from 'jwt-decode';
import { AuthProvider, UserIdentity } from 'react-admin';
import Surreal from 'surrealdb.js';
import { RaSurrealDb } from '.';

interface LoginPayload {
  username: string;
  password: string;
}

export const surrealDbAuthProvider = (options: RaSurrealDb): AuthProvider => {
  const { surrealdb_js, signinOptions } = options;

  const ensureConnexion = async ({ username, password }: LoginPayload): Promise<Surreal> => {
    const jwt = await surrealdb_js.signin({ ...signinOptions, user: username, pass: password });
    if (jwt) {
      const jwt_decoded = jwt_decode(jwt) as { ID: string; exp: number };
      options.auth = {
        jwt,
        id: jwt_decoded.ID,
        exp: jwt_decoded.exp * 1000,
      };
    }
    return surrealdb_js;
  };

  return {
    // authentication
    login: async (params: LoginPayload) => {
      return ensureConnexion(params);
    },
    checkError: async (error) => {
      console.log('error: ', error);
    },
    checkAuth: async (params) => {
      if (options.auth === undefined) throw 'no auth';
      const { exp } = options.auth;
      if (exp && exp < Date.now()) throw 'session expired';
    },
    logout: async () => {
      options.auth = undefined;
      return surrealdb_js.invalidate();
    },
    getIdentity: async (): Promise<UserIdentity> => {
      console.log('jwt_decode(jwt): ', jwt_decode(options.auth?.jwt || ''));
      if (options.auth === undefined) throw 'No identity';
      return { id: options.auth.id };
    },
    handleCallback: () => Promise.resolve(/* ... */),
    // authorization
    getPermissions: () => Promise.resolve(/* ... */),
  };
};
