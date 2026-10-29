import type SqlExecutorType from '../../types/sql.executor.type';
declare const fromD1: (db: {
    prepare: (sql: string) => {
        bind: (...params: unknown[]) => {
            all: () => Promise<{
                results?: Record<string, unknown>[];
            }>;
        };
    };
}) => SqlExecutorType;
export default fromD1;
