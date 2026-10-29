'use strict';

import rowToPending from '../../../src/functions/sql/row.to.pending';

const row = {
	state_id: 's1',
	client_id: 'c1',
	client_name: 'Name',
	redirect_uri: 'https://a/cb',
	code_challenge: 'ch',
	resource: 'r',
	client_state: 'cs',
	upstream_code_verifier: 'uv',
	user_id: 'u1',
	user_display_name: 'User',
	expires_at: '2000'
};

describe('row.to.pending tests', () => {
	it('should be defined', () => {
		expect(rowToPending).toBeDefined();
	});

	it('should map a full row', () => {
		expect(rowToPending(row)).toEqual({
			stateId: 's1',
			clientId: 'c1',
			clientName: 'Name',
			redirectUri: 'https://a/cb',
			codeChallenge: 'ch',
			resource: 'r',
			clientState: 'cs',
			upstreamCodeVerifier: 'uv',
			userId: 'u1',
			userDisplayName: 'User',
			expiresAt: new Date(2000)
		});
	});

	it('should map null optionals to undefined', () => {
		const mapped = rowToPending({...row, client_name: null, client_state: null, upstream_code_verifier: null, user_id: null, user_display_name: null});
		expect(mapped.clientName).toBeUndefined();
		expect(mapped.clientState).toBeUndefined();
		expect(mapped.upstreamCodeVerifier).toBeUndefined();
		expect(mapped.userId).toBeUndefined();
		expect(mapped.userDisplayName).toBeUndefined();
	});
});
