'use strict';

import type SqlExecutorType from '../../types/sql.executor.type';

const fromPg =
	(client: {query: (text: string, values: unknown[]) => Promise<{rows: Record<string, unknown>[]}>}): SqlExecutorType =>
	async (sql: string, params: unknown[]) =>
		(await client.query(sql, params)).rows;
export default fromPg;
