'use strict';

import assertPublicHost from '../../../src/functions/cimd/assert.public.host';

describe('assert.public.host tests', () => {
	it('should be defined', () => {
		expect(assertPublicHost).toBeDefined();
	});

	it('should accept public hosts', () => {
		expect(() => assertPublicHost(new URL('https://client.example/meta.json'))).not.toThrow();
		expect(() => assertPublicHost(new URL('https://8.8.8.8/meta.json'))).not.toThrow();
	});

	it.each([
		'https://localhost/m',
		'https://app.localhost/m',
		'https://svc.internal/m',
		'https://x.local/m',
		'https://x.localdomain/m',
		'https://x.home.arpa/m',
		'https://LOCALHOST/m'
	])('should reject internal name %s', (url) => {
		expect(() => assertPublicHost(new URL(url))).toThrow('client metadata host is not a public address');
	});

	it.each(['https://127.0.0.1/m', 'https://10.0.0.1/m', 'https://169.254.169.254/m', 'https://[::1]/m', 'https://[fe80::1]/m'])('should reject private address %s', (url) => {
		expect(() => assertPublicHost(new URL(url))).toThrow('client metadata host is not a public address');
	});
});
