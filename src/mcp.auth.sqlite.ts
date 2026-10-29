'use strict';

import fromBetterSqlite3 from './functions/sql/from.better.sqlite3';
import fromBunSqlite from './functions/sql/from.bun.sqlite';
import fromD1 from './functions/sql/from.d1';
import fromNodeSqlite from './functions/sql/from.node.sqlite';
import sqlSchema from './functions/sql/sql.schema';
import SqlStorage from './storage/sql.storage';

import type SqlExecutorType from './types/sql.executor.type';
import type SqlStorageOptionsType from './types/sql.storage.options.type';

const sqliteStorage = (executor: SqlExecutorType, options?: SqlStorageOptionsType): SqlStorage => new SqlStorage(executor, 'sqlite', options);
const sqliteSchema = (tablePrefix?: string): string[] => sqlSchema('sqlite', tablePrefix);

export {sqliteStorage, sqliteSchema, fromBetterSqlite3, fromNodeSqlite, fromBunSqlite, fromD1, SqlStorage};
export type {SqlExecutorType, SqlStorageOptionsType};
const McpAuthSqlite = {};
export default McpAuthSqlite;
