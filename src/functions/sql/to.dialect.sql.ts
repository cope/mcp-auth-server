'use strict';

import type SqlDialectType from '../../types/sql.dialect.type';

const toDialectSql = (sql: string, dialect: SqlDialectType): string => {
	if ('postgres' !== dialect) return sql;
	let index: number = 0;
	return sql.replaceAll('?', (): string => {
		index += 1;
		return `$${index}`;
	});
};
export default toDialectSql;
