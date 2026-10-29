'use strict';

import type SqlExecutorType from '../../types/sql.executor.type';

const fromBunSqlite =
	(db: {query: (sql: string) => {all: (...params: any[]) => Record<string, unknown>[]}}): SqlExecutorType =>
	(sql: string, params: unknown[]) =>
		db.query(sql).all(...params);
export default fromBunSqlite;
