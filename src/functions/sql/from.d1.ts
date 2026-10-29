'use strict';

import type SqlExecutorType from '../../types/sql.executor.type';

const fromD1 =
	(db: {prepare: (sql: string) => {bind: (...params: unknown[]) => {all: () => Promise<{results?: Record<string, unknown>[]}>}}}): SqlExecutorType =>
	async (sql: string, params: unknown[]) =>
		(
			await db
				.prepare(sql)
				.bind(...params)
				.all()
		).results ?? [];
export default fromD1;
