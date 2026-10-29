'use strict';

import toBase64Url from '../../../src/functions/crypto/to.base64.url';

describe('to.base64.url tests', () => {
	it('should be defined', () => {
		expect(toBase64Url).toBeDefined();
		expect(typeof toBase64Url).toBe('function');
	});

	it('should encode empty bytes as an empty string', () => {
		expect(toBase64Url(new Uint8Array([]))).toBe('');
	});

	it('should strip padding', () => {
		expect(toBase64Url(new Uint8Array([102, 111]))).toBe('Zm8');
	});

	it('should replace plus and slash with url safe characters', () => {
		expect(toBase64Url(new Uint8Array([251, 255, 191]))).toBe('-_-_');
	});
});
