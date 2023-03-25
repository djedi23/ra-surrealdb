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
import { type Result } from 'surrealdb.js';
import { type RaSurrealDb } from '.';

export const surrealDbDataProvider = <ResourceType extends string = string>(
  options: RaSurrealDb
): DataProvider<ResourceType> => {
  const { ensureConnexion } = options;

  return {
    getList: async <RecordType extends RaRecord = any>(
      resource: ResourceType,
      { pagination: { page, perPage }, sort: { field, order }, filter }: GetListParams
    ): Promise<GetListResult<RecordType>> => {
      const db = await ensureConnexion(options);

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
        total: count.result !== undefined ? count.result[0]?.count : 0,
      };
    },

    getOne: async <RecordType extends RaRecord = any>(
      _resource: ResourceType,
      { id }: GetOneParams
    ): Promise<GetOneResult<RecordType>> => {
      const db = await ensureConnexion(options);
      const [data]: RecordType[] = await db.select(id);
      return { data };
    },

    getMany: async <RecordType extends RaRecord = any>(
      resource: ResourceType,
      { ids }: GetManyParams
    ): Promise<GetManyResult<RecordType>> => {
      const db = await ensureConnexion(options);
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
      const db = await ensureConnexion(options);
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
      const db = await ensureConnexion(options);
      const result = await db.update(id.toString(), data);
      return { data: result as RecordType };
    },

    updateMany: async <RecordType extends RaRecord = any>(
      _resource: ResourceType,
      { ids, data }: UpdateManyParams
    ): Promise<UpdateManyResult<RecordType>> => {
      const db = await ensureConnexion(options);
      await Promise.all(ids.map(async (id) => await db.update(id.toString(), data)));

      return { data: ids };
    },

    create: async <RecordType extends RaRecord = any>(
      resource: ResourceType,
      { data }: CreateParams
    ): Promise<CreateResult<RecordType>> => {
      const db = await ensureConnexion(options);
      // FIXME: check if id starts with resource:
      const result: RecordType = await db.create(data.id ?? resource, data);
      return { data: result };
    },

    delete: async <RecordType extends RaRecord = any>(
      _resource: ResourceType,
      { id }: DeleteParams<RecordType>
    ): Promise<DeleteResult<RecordType>> => {
      const db = await ensureConnexion(options);
      await db.delete(id.toString());
      const data: RecordType = { id } as RecordType;
      return { data };
    },

    deleteMany: async <RecordType extends RaRecord = any>(
      resource: ResourceType,
      { ids }: DeleteManyParams<RecordType>
    ): Promise<DeleteManyResult<RecordType>> => {
      const db = await ensureConnexion(options);

      const [data]: [Result<RecordType[]>] = await db.query(
        `DELETE type::table($resource) WHERE id INSIDE $ids RETURN BEFORE;`,
        { resource, ids }
      );
      return { data: data.result?.map(({ id }) => id) ?? [] };
    },
  } as DataProvider<ResourceType>;
};
