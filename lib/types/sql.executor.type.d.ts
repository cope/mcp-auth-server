type SqlRowType = Record<string, unknown>;
type SqlExecutorType = (sql: string, params: unknown[]) => Promise<SqlRowType[]> | SqlRowType[];
export type { SqlRowType };
export default SqlExecutorType;
