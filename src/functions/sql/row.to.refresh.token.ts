'use strict';

import type RefreshTokenRecordType from '../../types/refresh.token.record.type';
import type {SqlRowType} from '../../types/sql.executor.type';
import optionalNumber from './optional.number';

const rowToRefreshToken = (row: SqlRowType): RefreshTokenRecordType => {
	const usedAt: number | undefined = optionalNumber(row.used_at);
	const revokedAt: number | undefined = optionalNumber(row.revoked_at);
	return {
		tokenHash: String(row.token_hash),
		familyId: String(row.family_id),
		clientId: String(row.client_id),
		userId: String(row.user_id),
		resource: String(row.resource),
		usedAt: undefined === usedAt ? undefined : new Date(usedAt),
		revokedAt: undefined === revokedAt ? undefined : new Date(revokedAt),
		expiresAt: new Date(Number(row.expires_at))
	};
};
export default rowToRefreshToken;
