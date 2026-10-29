'use strict';

import fromPg from './functions/sql/from.pg';
import fromPostgresJs from './functions/sql/from.postgres.js';
import sqlSchema from './functions/sql/sql.schema';
import SqlStorage from './storage/sql.storage';

import type SqlExecutorType from './types/sql.executor.type';
import type SqlStorageOptionsType from './types/sql.storage.options.type';

const postgresStorage = (executor: SqlExecutorType, options?: SqlStorageOptionsType): SqlStorage => new SqlStorage(executor, 'postgres', options);
const postgresSchema = (tablePrefix?: string): string[] => sqlSchema('postgres', tablePrefix);

export {postgresStorage, postgresSchema, fromPg, fromPostgresJs, SqlStorage};
export type {SqlExecutorType, SqlStorageOptionsType};
const McpAuthPostgres = {};
export default McpAuthPostgres;
