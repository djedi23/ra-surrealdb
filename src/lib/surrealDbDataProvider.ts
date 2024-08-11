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
import { type QueryResult, type RawQueryResult } from 'surrealdb.js/script/types';
import { type RaSurrealDb } from '.';

export const surrealDbDataProvider = <
  ResourceType extends string = string,
  RecordType extends RaRecord & RawQueryResult = any
>(
  options: RaSurrealDb
): DataProvider<ResourceType> => {
  const { ensureConnexion, queries } = options;

  return {
    getList: async (
      resource: ResourceType,
      params: GetListParams
    ): Promise<GetListResult<RecordType>> => {
      try {
        const db = await ensureConnexion(options);
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (queries !== undefined && queries[resource]?.getList != null) {
          const getList = queries[resource].getList;
          const result =
            getList !== undefined ? await getList(resource, params, db) : { data: [], total: 0 };
          return result;
        } else {
          const {
            pagination: { page, perPage } = { page: 1, perPage: 10 },
            sort: { field, order } = { field: '', order: 'ASC' },
            filter,
          } = params;
          const filtersClauses = Object.entries(filter).map(
            ([key, value]) => ` ${key} ~ "${value as string}"`
          );
          const filters = filtersClauses.length === 0 ? '' : 'WHERE ' + filtersClauses.join(' AND ');
          const [data, count]: [QueryResult<RecordType[]>, QueryResult<Array<{ count: number }>>] =
            await db.query(
              `SELECT * FROM type::table($resource) ${filters} ORDER BY ${field} ${order} LIMIT ${perPage} START ${
                (page - 1) * perPage
              }; SELECT count() FROM type::table($resource) ${filters} GROUP ALL; `,
              { resource }
            );

          return {
            data: data.result ?? [],
            total: count.result !== undefined ? count.result[0]?.count : 0,
          };
        }
      } catch (e) {
        console.error('Error in getList: ', e); // eslint-disable-line no-console
        return { data: [], total: 0 };
      }
    },

    getOne: async (
      resource: ResourceType,
      param: GetOneParams
    ): Promise<GetOneResult<RecordType>> => {
      try {
        const db = await ensureConnexion(options);
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (queries !== undefined && queries[resource]?.getOne != null) {
          const getOne = queries[resource].getOne;
          const result = getOne != null && (await getOne(resource, param, db));
          return { data: result };
        } else {
          const [data]: RecordType[] = (await db.select(param.id)) as unknown as RecordType[];
          return { data };
        }
      } catch (e) {
        console.error('Error in getOne: ', e); // eslint-disable-line no-console
        return { data: {} as RecordType };
      }
    },

    getMany: async (
      resource: ResourceType,
      params: GetManyParams
    ): Promise<GetManyResult<RecordType>> => {
      try {
        const db = await ensureConnexion(options);
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (queries !== undefined && queries[resource]?.getMany != null) {
          const getMany = queries[resource].getMany;
          const result = getMany !== undefined ? await getMany(resource, params, db) : { data: [] };
          return result;
        } else {
          const { ids } = params;
          const [data]: [QueryResult<RecordType[]>] = await db.query(
            `SELECT * FROM type::table($resource) WHERE id INSIDE $ids;`,
            { resource, ids }
          );

          return { data: data.result ?? [] };
        }
      } catch (e) {
        console.error('Error in getMany: ', e); // eslint-disable-line no-console
        return { data: [] };
      }
    },

    getManyReference: async (
      resource: ResourceType,
      params: GetManyReferenceParams
    ): Promise<GetManyReferenceResult<RecordType>> => {
      try {
        const db = await ensureConnexion(options);
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (queries !== undefined && queries[resource]?.getManyReference != null) {
          const getManyReferences = queries[resource].getManyReference;
          const result =
            getManyReferences !== undefined
              ? await getManyReferences(resource, params, db)
              : { data: [] };
          return result;
        } else {
          const {
            id,
            target,
            pagination: { page, perPage },
            sort: { field, order },
            filter,
          } = params;
          const filtersClauses = Object.entries(filter).map(
            ([key, value]) => ` ${key} ~ "${value as string}"`
          );
          const filters = filtersClauses.length === 0 ? '' : 'WHERE ' + filtersClauses.join(' AND ');
          const query = `SELECT ${target}.*.* as data , ${target}.${field} FROM ${id} ${filters} ORDER BY ${target}.${field} ${order} LIMIT ${perPage} START ${
            (page - 1) * perPage
          };
SELECT count(${target}) FROM ${id} ${filters} GROUP ALL;`;

          const [data, count]: [QueryResult<RecordType[]>, QueryResult<Array<{ count: number }>>] =
            await db.query(query, { resource });

          return {
            data: data.result != null ? data.result[0].data : [],
            total: count.result != null ? count.result[0].count : 0,
          };
        }
      } catch (e) {
        console.error('Error in getManyReferences: ', e); // eslint-disable-line no-console
        return { data: [] };
      }
    },

    update: async (
      resource: ResourceType,
      params: UpdateParams
    ): Promise<UpdateResult<RecordType>> => {
      try {
        const db = await ensureConnexion(options);
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (queries !== undefined && queries[resource]?.update != null) {
          const update = queries[resource].update;
          const result =
            update !== undefined ? await update(resource, params, db) : { data: {} as RecordType };
          return result;
        } else {
          const { id, data } = params;
          const [result] = (await db.update(id.toString(), data)) as RecordType[];
          return { data: result };
        }
      } catch (e) {
        console.error('Error in getUpdate: ', e); // eslint-disable-line no-console
        return { data: {} as RecordType };
      }
    },

    updateMany: async (
      resource: ResourceType,
      params: UpdateManyParams
    ): Promise<UpdateManyResult<RecordType>> => {
      try {
        const db = await ensureConnexion(options);
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (queries !== undefined && queries[resource]?.updateMany != null) {
          const updateMany = queries[resource].updateMany;
          const result =
            updateMany !== undefined ? await updateMany(resource, params, db) : { data: [] };
          return result;
        } else {
          const { ids, data } = params;
          await Promise.all(ids.map(async (id) => await db.update(id.toString(), data)));

          return { data: ids };
        }
      } catch (e) {
        console.error('Error in updateMany: ', e); // eslint-disable-line no-console
        return { data: [] };
      }
    },

    create: async (
      resource: ResourceType,
      params: CreateParams
    ): Promise<CreateResult<RecordType>> => {
      try {
        const db = await ensureConnexion(options);
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (queries !== undefined && queries[resource]?.create != null) {
          const create = queries[resource].create;
          const result = create != null && (await create(resource, params, db));
          return { data: result };
        } else {
          const { data } = params;
          // FIXME: check if id starts with resource:
          const [result]: RecordType[] = (await db.create(data.id ?? resource, data)) as RecordType[];
          return { data: result };
        }
      } catch (e) {
        console.error('Error in create: ', e); // eslint-disable-line no-console
        return { data: {} as RecordType };
      }
    },

    delete: async (
      resource: ResourceType,
      params: DeleteParams<RecordType>
    ): Promise<DeleteResult<RecordType>> => {
      try {
        const db = await ensureConnexion(options);
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (queries !== undefined && queries[resource]?.delete != null) {
          const delete_ = queries[resource].delete;
          const result = delete_ != null ? await delete_(resource, params, db) : undefined;
          return result ?? { data: {} as RecordType };
        } else {
          const { id } = params;
          await db.delete(id.toString());
          const data: RecordType = { id } as RecordType;
          return { data };
        }
      } catch (e) {
        console.error('Error in delete: ', e); // eslint-disable-line no-console
        return { data: {} as RecordType };
      }
    },

    deleteMany: async <RecordType extends RaRecord & RawQueryResult = any>(
      resource: ResourceType,
      params: DeleteManyParams<RecordType>
    ): Promise<DeleteManyResult<RecordType>> => {
      try {
        const db = await ensureConnexion(options);
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (queries !== undefined && queries[resource]?.deleteMany != null) {
          const deleteMany = queries[resource].deleteMany;
          const result = deleteMany != null ? await deleteMany(resource, params, db) : undefined;
          return result ?? { data: [] };
        } else {
          const { ids } = params;
          const [data]: Array<QueryResult<RecordType>> = await db.query(
            `DELETE type::table($resource) WHERE id INSIDE $ids RETURN BEFORE;`,
            { resource, ids }
          );
          return { data: data.result?.map(({ id }: { id: string }) => id) ?? [] };
        }
      } catch (e) {
        console.error('Error in deleteMany: ', e); // eslint-disable-line no-console
        return { data: [] };
      }
    },
  } as DataProvider<ResourceType>;
};
