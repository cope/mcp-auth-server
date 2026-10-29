'use strict';

import rowToCode from '../../../src/functions/sql/row.to.code';

const row = {code_hash: 'h', client_id: 'c1', redirect_uri: 'https://a/cb', code_challenge: 'ch', resource: 'r', user_id: 'u1', used_at: '500', expires_at: '2000'};

describe('row.to.code tests', () => {
	it('should be defined', () => {
		expect(rowToCode).toBeDefined();
	});

	it('should map a used code', () => {
		expect(rowToCode(row)).toEqual({
			codeHash: 'h',
			clientId: 'c1',
			redirectUri: 'https://a/cb',
			codeChallenge: 'ch',
			resource: 'r',
			userId: 'u1',
			usedAt: new Date(500),
			expiresAt: new Date(2000)
		});
	});

	it('should map an unused code', () => {
		expect(rowToCode({...row, used_at: null}).usedAt).toBeUndefined();
	});
});
