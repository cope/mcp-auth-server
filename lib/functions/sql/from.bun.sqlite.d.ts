import type SqlExecutorType from '../../types/sql.executor.type';
declare const fromBunSqlite: (db: {
    query: (sql: string) => {
        all: (...params: any[]) => Record<string, unknown>[];
    };
}) => SqlExecutorType;
export default fromBunSqlite;
