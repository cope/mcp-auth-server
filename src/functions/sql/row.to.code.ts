'use strict';

import type AuthorizationCodeRecordType from '../../types/authorization.code.record.type';
import type {SqlRowType} from '../../types/sql.executor.type';
import optionalNumber from './optional.number';

const rowToCode = (row: SqlRowType): AuthorizationCodeRecordType => {
	const usedAt: number | undefined = optionalNumber(row.used_at);
	return {
		codeHash: String(row.code_hash),
		clientId: String(row.client_id),
		redirectUri: String(row.redirect_uri),
		codeChallenge: String(row.code_challenge),
		resource: String(row.resource),
		userId: String(row.user_id),
		usedAt: undefined === usedAt ? undefined : new Date(usedAt),
		expiresAt: new Date(Number(row.expires_at))
	};
};
export default rowToCode;
