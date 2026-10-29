import type RefreshTokenRecordType from '../../types/refresh.token.record.type';
import type { SqlRowType } from '../../types/sql.executor.type';
declare const rowToRefreshToken: (row: SqlRowType) => RefreshTokenRecordType;
export default rowToRefreshToken;
