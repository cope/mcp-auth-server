'use strict';

import type PendingAuthorizationType from '../../types/pending.authorization.type';
import type {SqlRowType} from '../../types/sql.executor.type';
import optionalText from './optional.text';

const rowToPending = (row: SqlRowType): PendingAuthorizationType => ({
	stateId: String(row.state_id),
	clientId: String(row.client_id),
	clientName: optionalText(row.client_name),
	redirectUri: String(row.redirect_uri),
	codeChallenge: String(row.code_challenge),
	resource: String(row.resource),
	clientState: optionalText(row.client_state),
	upstreamCodeVerifier: optionalText(row.upstream_code_verifier),
	userId: optionalText(row.user_id),
	userDisplayName: optionalText(row.user_display_name),
	expiresAt: new Date(Number(row.expires_at))
});
export default rowToPending;
