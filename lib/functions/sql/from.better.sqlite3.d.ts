import type SqlExecutorType from '../../types/sql.executor.type';
type PreparedType = {
    reader: boolean;
    all: (...params: any[]) => Record<string, unknown>[];
    run: (...params: any[]) => unknown;
};
declare const fromBetterSqlite3: (db: {
    prepare: (sql: string) => PreparedType;
}) => SqlExecutorType;
export default fromBetterSqlite3;
