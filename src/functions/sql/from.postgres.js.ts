'use strict';

import type SqlExecutorType from '../../types/sql.executor.type';

const fromPostgresJs =
	(client: {unsafe: (text: string, values: any[]) => Promise<ArrayLike<Record<string, unknown>>>}): SqlExecutorType =>
	async (sql: string, params: unknown[]) =>
		Array.from(await client.unsafe(sql, params as any[]));
export default fromPostgresJs;
