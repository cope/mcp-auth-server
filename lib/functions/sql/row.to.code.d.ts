import type AuthorizationCodeRecordType from '../../types/authorization.code.record.type';
import type { SqlRowType } from '../../types/sql.executor.type';
declare const rowToCode: (row: SqlRowType) => AuthorizationCodeRecordType;
export default rowToCode;
