'use strict';

import wrapPem from '../../../src/functions/keys/wrap.pem';

describe('wrap.pem tests', () => {
	it('should be defined', () => {
		expect(wrapPem).toBeDefined();
		expect(typeof wrapPem).toBe('function');
	});

	it('should wrap der bytes as a PKCS8 pem with 64 char lines', () => {
		const der = new Uint8Array(100).fill(65);
		const pem = wrapPem(der);
		const lines = pem.split('\n');

		expect(lines[0]).toBe('-----BEGIN PRIVATE KEY-----');
		expect(lines[lines.length - 1]).toBe('-----END PRIVATE KEY-----');
		expect(lines[1]).toHaveLength(64);
		expect(Buffer.from(lines.slice(1, -1).join(''), 'base64')).toEqual(Buffer.from(der));
	});

	it('should still produce a pem for empty input', () => {
		expect(wrapPem(new Uint8Array([]))).toBe('-----BEGIN PRIVATE KEY-----\n\n-----END PRIVATE KEY-----');
	});
});
