'use strict';

import sha256Base64Url from '../../../src/functions/crypto/sha256.base64.url';

describe('sha256.base64.url tests', () => {
	it('should be defined', () => {
		expect(sha256Base64Url).toBeDefined();
		expect(typeof sha256Base64Url).toBe('function');
	});

	it('should return the unpadded base64url digest', async () => {
		expect(await sha256Base64Url('abc')).toBe('ungWv48Bz-pBQUDeXa4iI7ADYaOWF3qctBD_YfIAFa0');
	});
});
