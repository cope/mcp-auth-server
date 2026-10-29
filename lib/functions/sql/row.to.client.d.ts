import type ClientRecordType from '../../types/client.record.type';
import type { SqlRowType } from '../../types/sql.executor.type';
declare const rowToClient: (row: SqlRowType) => ClientRecordType;
export default rowToClient;
