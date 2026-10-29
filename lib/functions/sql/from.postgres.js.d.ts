import type SqlExecutorType from '../../types/sql.executor.type';
declare const fromPostgresJs: (client: {
    unsafe: (text: string, values: any[]) => Promise<ArrayLike<Record<string, unknown>>>;
}) => SqlExecutorType;
export default fromPostgresJs;
