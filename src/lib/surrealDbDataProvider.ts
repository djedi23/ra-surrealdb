import jwt_decode from 'jwt-decode';
import {
  CreateParams,
  CreateResult,
  DataProvider,
  DeleteManyParams,
  DeleteManyResult,
  DeleteParams,
  DeleteResult,
  GetListParams,
  GetListResult,
  GetManyParams,
  GetManyReferenceParams,
  GetManyReferenceResult,
  GetManyResult,
  GetOneParams,
  GetOneResult,
  RaRecord,
  UpdateManyParams,
  UpdateManyResult,
  UpdateParams,
  UpdateResult,
} from 'react-admin';
import Surreal, { Auth, DatabaseAuth, Result } from 'surrealdb.js';
import { RaSurrealDb, RaSurrealDbAuth } from '.';

export const surrealDbDataProvider = <ResourceType extends string = string>(
  options: RaSurrealDb
): DataProvider<ResourceType> => {
  const { surrealdb_js, signinOptions, localStorage: localStorageKey } = options;

  const ensureConnexion = async (): Promise<Surreal> => {
    if (options.auth === undefined && signinOptions.user) {
      const jwt = await surrealdb_js.signin(signinOptions as Auth);
      const jwt_decoded = jwt_decode(jwt) as { ID: string; exp: number };
      options.auth = {
        jwt,
        id: jwt_decoded.ID,
        exp: jwt_decoded.exp * 1000,
      };

      await surrealdb_js.use(
        (signinOptions as DatabaseAuth).NS || 'test',
        (signinOptions as DatabaseAuth).DB || 'test'
      );
    } else if (localStorageKey && options.auth?.jwt === undefined) {
      const auth_string = localStorage.getItem(localStorageKey);
      const auth: RaSurrealDbAuth | undefined = auth_string && JSON.parse(auth_string);
      auth?.jwt && (await surrealdb_js.authenticate(auth.jwt));
      options.auth = auth;

      await surrealdb_js.use(
        (signinOptions as DatabaseAuth).NS || 'test',
        (signinOptions as DatabaseAuth).DB || 'test'
      );
    }
    return surrealdb_js;
  };

  return {
    getList: async <RecordType extends RaRecord = any>(
      resource: ResourceType,
      { pagination: { page, perPage }, sort: { field, order }, filter }: GetListParams
    ): Promise<GetListResult<RecordType>> => {
      let db = await ensureConnexion();

      let filters_clauses = Object.entries(filter).map(([key, value]) => ` ${key} ~ "${value}"`);
      const filters = filters_clauses.length === 0 ? '' : 'WHERE ' + filters_clauses.join(' AND ');
      const [data, count]: [Result<RecordType[]>, Result<{ count: number }[]>] = await db.query(
        `SELECT * FROM type::table($resource) ${filters} ORDER BY ${field} ${order} LIMIT ${perPage} START ${
          (page - 1) * perPage
        }; SELECT count() FROM type::table($resource) ${filters} GROUP BY ALL; `,
        { resource }
      );
      return {
        data: data.result || [],
        total: count.result ? count.result[0]?.count : 0,
      };
    },

    getOne: async <RecordType extends RaRecord = any>(
      _resource: ResourceType,
      { id }: GetOneParams
    ): Promise<GetOneResult<RecordType>> => {
      let db = await ensureConnexion();
      const [data]: RecordType[] = await db.select(id);
      return { data };
    },

    getMany: async <RecordType extends RaRecord = any>(
      resource: ResourceType,
      { ids }: GetManyParams
    ): Promise<GetManyResult<RecordType>> => {
      let db = await ensureConnexion();
      const [data]: [Result<RecordType[]>] = await db.query(
        `SELECT * FROM type::table($resource) WHERE id INSIDE $ids;`,
        { resource, ids }
      );

      return { data: data.result || [] };
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
      let db = await ensureConnexion();
      let filters_clauses = Object.entries(filter).map(([key, value]) => ` ${key} ~ "${value}"`);
      const filters = filters_clauses.length === 0 ? '' : 'WHERE ' + filters_clauses.join(' AND ');
      const query = `SELECT ${target}.*.* as data FROM ${id} ${filters} ORDER BY ${target}.${field} ${order} LIMIT ${perPage} START ${
        (page - 1) * perPage
      };
SELECT count(${target}) FROM ${id} ${filters} GROUP BY ALL; `;
      const [data, count]: [Result<RecordType[]>, Result<{ count: number }[]>] = await db.query(
        query,
        { resource }
      );

      return {
        data: data.result ? data.result[0].data : [],
        total: count.result ? count.result[0].count : 0,
      };
    },

    update: async <RecordType extends RaRecord = any>(
      _resource: ResourceType,
      { id, data }: UpdateParams
    ): Promise<UpdateResult<RecordType>> => {
      let db = await ensureConnexion();
      const result = await db.update(id.toString(), data);
      return { data: result as RecordType };
    },

    updateMany: async <RecordType extends RaRecord = any>(
      _resource: ResourceType,
      { ids, data }: UpdateManyParams
    ): Promise<UpdateManyResult<RecordType>> => {
      let db = await ensureConnexion();
      await Promise.all(ids.map((id) => db.update(id.toString(), data)));

      return { data: ids };
    },

    create: async <RecordType extends RaRecord = any>(
      resource: ResourceType,
      { data }: CreateParams
    ): Promise<CreateResult<RecordType>> => {
      let db = await ensureConnexion();
      // FIXME: check if id starts with resource:
      const result = await db.create(data.id || resource, data);
      return { data: result as RecordType };
    },

    delete: async <RecordType extends RaRecord = any>(
      _resource: ResourceType,
      { id }: DeleteParams<RecordType>
    ): Promise<DeleteResult<RecordType>> => {
      let db = await ensureConnexion();
      await db.delete(id.toString());
      return { data: { id } as RecordType };
    },

    deleteMany: async <RecordType extends RaRecord = any>(
      resource: ResourceType,
      { ids }: DeleteManyParams<RecordType>
    ): Promise<DeleteManyResult<RecordType>> => {
      let db = await ensureConnexion();

      const [data]: [Result<RecordType[]>] = await db.query(
        `DELETE type::table($resource) WHERE id INSIDE $ids RETURN BEFORE;`,
        { resource, ids }
      );
      return { data: data.result?.map(({ id }) => id) || [] };
    },
  } as DataProvider<ResourceType>;
};
