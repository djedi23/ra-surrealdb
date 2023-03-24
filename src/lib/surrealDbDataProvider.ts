import jwt_decode from 'jwt-decode';
import {
  type CreateParams,
  type CreateResult,
  type DataProvider,
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
  type GetOneResult,
  type RaRecord,
  type UpdateManyParams,
  type UpdateManyResult,
  type UpdateParams,
  type UpdateResult,
} from 'react-admin';
import { type Auth, type DatabaseAuth, type Result } from 'surrealdb.js';
import type Surreal from 'surrealdb.js';
import { type JWTInterface, type RaSurrealDb, type RaSurrealDbAuth } from '.';

export const surrealDbDataProvider = <ResourceType extends string = string>(
  options: RaSurrealDb
): DataProvider<ResourceType> => {
  const { surrealdb, signinOptions, localStorage: localStorageKey } = options;

  const ensureConnexion = async (): Promise<Surreal> => {
    if (options.auth === undefined && signinOptions.user !== undefined) {
      const jwt = await surrealdb.signin(signinOptions as Auth);
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
    } else if (localStorageKey !== undefined && options.auth?.jwt === undefined) {
      const authString = localStorage.getItem(localStorageKey);
      const auth: RaSurrealDbAuth | undefined = authString !== null && JSON.parse(authString);
      auth?.jwt !== undefined && (await surrealdb.authenticate(auth.jwt));
      options.auth = auth;

      await surrealdb.use(
        (signinOptions as DatabaseAuth).NS ?? 'test',
        (signinOptions as DatabaseAuth).DB ?? 'test'
      );
    }
    return surrealdb;
  };

  return {
    getList: async <RecordType extends RaRecord = any>(
      resource: ResourceType,
      { pagination: { page, perPage }, sort: { field, order }, filter }: GetListParams
    ): Promise<GetListResult<RecordType>> => {
      const db = await ensureConnexion();

      const filtersClauses = Object.entries(filter).map(
        ([key, value]) => ` ${key} ~ "${value as string}"`
      );
      const filters = filtersClauses.length === 0 ? '' : 'WHERE ' + filtersClauses.join(' AND ');
      const [data, count]: [Result<RecordType[]>, Result<Array<{ count: number }>>] = await db.query(
        `SELECT * FROM type::table($resource) ${filters} ORDER BY ${field} ${order} LIMIT ${perPage} START ${
          (page - 1) * perPage
        }; SELECT count() FROM type::table($resource) ${filters} GROUP BY ALL; `,
        { resource }
      );
      return {
        data: data.result ?? [],
        total: count.result != null ? count.result[0]?.count : 0,
      };
    },

    getOne: async <RecordType extends RaRecord = any>(
      _resource: ResourceType,
      { id }: GetOneParams
    ): Promise<GetOneResult<RecordType>> => {
      const db = await ensureConnexion();
      const [data]: RecordType[] = await db.select(id);
      return { data };
    },

    getMany: async <RecordType extends RaRecord = any>(
      resource: ResourceType,
      { ids }: GetManyParams
    ): Promise<GetManyResult<RecordType>> => {
      const db = await ensureConnexion();
      const [data]: [Result<RecordType[]>] = await db.query(
        `SELECT * FROM type::table($resource) WHERE id INSIDE $ids;`,
        { resource, ids }
      );

      return { data: data.result ?? [] };
    },

    getManyReference: async <RecordType extends RaRecord = any>(
      resource: ResourceType,
      {
        id,
        target,
        pagination: { page, perPage },
        sort: { field, order },
        filter,
      }: GetManyReferenceParams
    ): Promise<GetManyReferenceResult<RecordType>> => {
      const db = await ensureConnexion();
      const filtersClauses = Object.entries(filter).map(
        ([key, value]) => ` ${key} ~ "${value as string}"`
      );
      const filters = filtersClauses.length === 0 ? '' : 'WHERE ' + filtersClauses.join(' AND ');
      const query = `SELECT ${target}.*.* as data FROM ${id} ${filters} ORDER BY ${target}.${field} ${order} LIMIT ${perPage} START ${
        (page - 1) * perPage
      };
SELECT count(${target}) FROM ${id} ${filters} GROUP BY ALL; `;
      const [data, count]: [Result<RecordType[]>, Result<Array<{ count: number }>>] = await db.query(
        query,
        { resource }
      );

      return {
        data: data.result != null ? data.result[0].data : [],
        total: count.result != null ? count.result[0].count : 0,
      };
    },

    update: async <RecordType extends RaRecord = any>(
      _resource: ResourceType,
      { id, data }: UpdateParams
    ): Promise<UpdateResult<RecordType>> => {
      const db = await ensureConnexion();
      const result = await db.update(id.toString(), data);
      return { data: result as RecordType };
    },

    updateMany: async <RecordType extends RaRecord = any>(
      _resource: ResourceType,
      { ids, data }: UpdateManyParams
    ): Promise<UpdateManyResult<RecordType>> => {
      const db = await ensureConnexion();
      await Promise.all(ids.map(async (id) => await db.update(id.toString(), data)));

      return { data: ids };
    },

    create: async <RecordType extends RaRecord = any>(
      resource: ResourceType,
      { data }: CreateParams
    ): Promise<CreateResult<RecordType>> => {
      const db = await ensureConnexion();
      // FIXME: check if id starts with resource:
      const result = await db.create(data.id ?? resource, data);
      return { data: result as RecordType };
    },

    delete: async <RecordType extends RaRecord = any>(
      _resource: ResourceType,
      { id }: DeleteParams<RecordType>
    ): Promise<DeleteResult<RecordType>> => {
      const db = await ensureConnexion();
      await db.delete(id.toString());
      return { data: { id } as RecordType };
    },

    deleteMany: async <RecordType extends RaRecord = any>(
      resource: ResourceType,
      { ids }: DeleteManyParams<RecordType>
    ): Promise<DeleteManyResult<RecordType>> => {
      const db = await ensureConnexion();

      const [data]: [Result<RecordType[]>] = await db.query(
        `DELETE type::table($resource) WHERE id INSIDE $ids RETURN BEFORE;`,
        { resource, ids }
      );
      return { data: data.result?.map(({ id }) => id) ?? [] };
    },
  } as DataProvider<ResourceType>;
};
