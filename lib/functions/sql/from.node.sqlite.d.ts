import type SqlExecutorType from '../../types/sql.executor.type';
declare const fromNodeSqlite: (db: {
    prepare: (sql: string) => {
        all: (...params: any[]) => Record<string, unknown>[];
    };
}) => SqlExecutorType;
export default fromNodeSqlite;
