import type SqlDialectType from '../../types/sql.dialect.type';
declare const sqlSchema: (dialect: SqlDialectType, prefix?: string) => string[];
export default sqlSchema;
