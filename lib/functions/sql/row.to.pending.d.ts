import type PendingAuthorizationType from '../../types/pending.authorization.type';
import type { SqlRowType } from '../../types/sql.executor.type';
declare const rowToPending: (row: SqlRowType) => PendingAuthorizationType;
export default rowToPending;
