'use strict';

import type SqlExecutorType from '../../types/sql.executor.type';

const fromNodeSqlite =
	(db: {prepare: (sql: string) => {all: (...params: any[]) => Record<string, unknown>[]}}): SqlExecutorType =>
	(sql: string, params: unknown[]) =>
		db.prepare(sql).all(...params);
export default fromNodeSqlite;
