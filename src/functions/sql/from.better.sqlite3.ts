'use strict';

import type SqlExecutorType from '../../types/sql.executor.type';

type PreparedType = {reader: boolean; all: (...params: any[]) => Record<string, unknown>[]; run: (...params: any[]) => unknown};

const fromBetterSqlite3 =
	(db: {prepare: (sql: string) => PreparedType}): SqlExecutorType =>
	(sql: string, params: unknown[]) => {
		const statement: PreparedType = db.prepare(sql);
		if (statement.reader) return statement.all(...params);
		statement.run(...params);
		return [];
	};
export default fromBetterSqlite3;
