import type SqlExecutorType from '../../types/sql.executor.type';
declare const fromPg: (client: {
    query: (text: string, values: unknown[]) => Promise<{
        rows: Record<string, unknown>[];
    }>;
}) => SqlExecutorType;
export default fromPg;
