import jwt_decode from 'jwt-decode';
import { useMemo } from 'react';
import {
  type CreateParams,
  type DeleteManyParams,
  type DeleteManyResult,
  type DeleteParams,
  type DeleteResult,
  type GetListParams,
  type GetListResult,
  type GetManyParams,
  type GetManyReferenceParams,
  type GetManyReferenceResult,
  type GetManyResult,
  type GetOneParams,
  type Identifier,
  type RaRecord,
  type UpdateManyParams,
  type UpdateManyResult,
  type UpdateParams,
  type UpdateResult,
  type UserIdentity,
} from 'react-admin';
import Surreal from 'surrealdb.js';
import { type AnyAuth, type DatabaseAuth, type RawQueryResult } from 'surrealdb.js/script/types';

export { surrealDbAuthProvider } from './surrealDbAuthProvider';
export { surrealDbDataProvider } from './surrealDbDataProvider';

interface EnsureConnexionOption {
  surrealdb: Surreal;
  localStorageKey?: string;
  auth?: RaSurrealDbAuth;
}

export interface RaSurrealDb extends EnsureConnexionOption {
  ensureConnexion: (options: EnsureConnexionOption) => Promise<Surreal>;
  queries?: Record<string, RaSurrealQueries>;
}

export interface RaSurrealQueries<
  ResourceType extends string = string,
  RecordType extends RaRecord & RawQueryResult = any
> {
  getList?: (
    resource: ResourceType,
    params: GetListParams,
    db: Surreal
  ) => Promise<GetListResult<RecordType>>;
  getOne?: (resource: string, param: GetOneParams, db: Surreal) => Promise<RecordType>;
  getMany?: (
    resource: ResourceType,
    params: GetManyParams,
    db: Surreal
  ) => Promise<GetManyResult<RecordType>>;
  getManyReference?: (
    resource: ResourceType,
    params: GetManyReferenceParams,
    db: Surreal
  ) => Promise<GetManyReferenceResult<RecordType>>;
  update?: (
    _resource: ResourceType,
    params: UpdateParams,
    db: Surreal
  ) => Promise<UpdateResult<RecordType>>;
  updateMany?: (
    resource: ResourceType,
    params: UpdateManyParams,
    db: Surreal
  ) => Promise<UpdateManyResult<RecordType>>;
  create?: (resource: string, param: CreateParams, db: Surreal) => Promise<RecordType>;
  delete?: (
    resource: ResourceType,
    param: DeleteParams<RecordType>,
    db: Surreal
  ) => Promise<DeleteResult<RecordType>>;
  deleteMany: (
    resource: ResourceType,
    params: DeleteManyParams<RecordType>,
    db: Surreal
  ) => Promise<DeleteManyResult<RecordType>>;
}

type IdentityFunction = (id: Identifier, db: Surreal) => Promise<UserIdentity>;
type PermissionFunction = (id: Identifier, db: Surreal, params: any) => Promise<any>;
export interface RaSurrealDbAuthProviderOptions extends RaSurrealDb {
  signinOptions: AnyAuth;
  getIdentity?: IdentityFunction;
  getPermissions?: PermissionFunction;
}

interface RaSurrealDbOption
  extends Pick<
    RaSurrealDbAuthProviderOptions,
    'signinOptions' | 'localStorageKey' | 'getIdentity' | 'getPermissions' | 'queries'
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
  queries,
}: RaSurrealDbOption): RaSurrealDbAuthProviderOptions =>
  useMemo(() => {
    const surrealdb = new Surreal(url);

    return {
      surrealdb,
      signinOptions,
      localStorageKey,
      getIdentity,
      getPermissions,
      queries,
      ensureConnexion: async (options: EnsureConnexionOption): Promise<Surreal> => {
        if (options.auth === undefined && signinOptions.user !== undefined) {
          const jwt = await surrealdb.signin(signinOptions);
          if (jwt === undefined) throw Error('Signin error from SurrealDB.');

          const jwtDecoded = jwt_decode<JWTInterface>(jwt);
          options.auth = {
            jwt,
            id: jwtDecoded.ID,
            exp: jwtDecoded.exp * 1000,
          };

          await surrealdb.use({
            ns: (signinOptions as DatabaseAuth).NS ?? 'test',
            db: (signinOptions as DatabaseAuth).DB ?? 'test',
          });
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
          await surrealdb.use({
            ns: (signinOptions as DatabaseAuth).NS ?? 'test',
            db: (signinOptions as DatabaseAuth).DB ?? 'test',
          });
        }
        return surrealdb;
      },
    };
  }, [url, signinOptions, localStorage, getIdentity, getPermissions]);
