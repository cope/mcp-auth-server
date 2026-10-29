'use strict';

import randomToken from '../../../src/functions/crypto/random.token';

describe('random.token tests', () => {
	it('should be defined', () => {
		expect(randomToken).toBeDefined();
		expect(typeof randomToken).toBe('function');
	});

	it('should default to 32 bytes encoded as 43 base64url chars', () => {
		expect(randomToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
	});

	it('should honour a custom byte length', () => {
		expect(randomToken(3)).toMatch(/^[A-Za-z0-9_-]{4}$/);
	});

	it('should return a different value on every call', () => {
		expect(randomToken()).not.toBe(randomToken());
	});
});
