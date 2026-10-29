'use strict';

import signingKeyFromEnv from '../../../src/functions/keys/signing.key.from.env';

describe('signing.key.from.env tests', () => {
	it('should be defined', () => {
		expect(signingKeyFromEnv).toBeDefined();
		expect(typeof signingKeyFromEnv).toBe('function');
	});

	it('should throw when the variable is missing', () => {
		expect(() => signingKeyFromEnv({}, 'SIGNING_KEY')).toThrow('SIGNING_KEY is not set');
	});

	it('should throw when the variable is empty', () => {
		expect(() => signingKeyFromEnv({SIGNING_KEY: ''}, 'SIGNING_KEY')).toThrow('SIGNING_KEY is not set');
	});

	it('should return the normalized value', () => {
		expect(signingKeyFromEnv({SIGNING_KEY: '  line1\\nline2  '}, 'SIGNING_KEY')).toBe('line1\nline2');
	});
});
