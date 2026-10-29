'use strict';

import rowToRefreshToken from '../../../src/functions/sql/row.to.refresh.token';

const row = {token_hash: 't', family_id: 'f', client_id: 'c1', user_id: 'u1', resource: 'r', used_at: '500', revoked_at: '700', expires_at: '2000'};

describe('row.to.refresh.token tests', () => {
	it('should be defined', () => {
		expect(rowToRefreshToken).toBeDefined();
	});

	it('should map a used and revoked token', () => {
		expect(rowToRefreshToken(row)).toEqual({
			tokenHash: 't',
			familyId: 'f',
			clientId: 'c1',
			userId: 'u1',
			resource: 'r',
			usedAt: new Date(500),
			revokedAt: new Date(700),
			expiresAt: new Date(2000)
		});
	});

	it('should map a fresh token', () => {
		const mapped = rowToRefreshToken({...row, used_at: null, revoked_at: undefined});
		expect(mapped.usedAt).toBeUndefined();
		expect(mapped.revokedAt).toBeUndefined();
	});
});
