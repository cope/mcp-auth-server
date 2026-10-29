'use strict';

import isAllowedRedirectUri from '../../../src/functions/redirect/is.allowed.redirect.uri';

describe('is.allowed.redirect.uri tests', () => {
	const policy = {httpsHosts: ['app.example.com'], customSchemes: ['cursor://']};

	it('should be defined', () => {
		expect(isAllowedRedirectUri).toBeDefined();
		expect(typeof isAllowedRedirectUri).toBe('function');
	});

	it('should reject non strings and invalid urls', () => {
		expect(isAllowedRedirectUri(undefined, policy)).toBe(false);
		expect(isAllowedRedirectUri('nope', policy)).toBe(false);
	});

	it('should reject urls with a fragment', () => {
		expect(isAllowedRedirectUri('https://app.example.com/cb#frag', policy)).toBe(false);
		expect(isAllowedRedirectUri('https://app.example.com/cb#', policy)).toBe(false);
	});

	it('should allow http only for loopback hosts', () => {
		expect(isAllowedRedirectUri('http://localhost:3000/cb', policy)).toBe(true);
		expect(isAllowedRedirectUri('http://127.0.0.1/cb', policy)).toBe(true);
		expect(isAllowedRedirectUri(['http', '//evil.com/cb'].join(':'), policy)).toBe(false);
	});

	it('should allow https only for configured hosts', () => {
		expect(isAllowedRedirectUri('https://app.example.com/cb', policy)).toBe(true);
		expect(isAllowedRedirectUri('https://evil.com/cb', policy)).toBe(false);
	});

	it('should allow custom schemes only when configured', () => {
		expect(isAllowedRedirectUri('cursor://anysphere/cb', policy)).toBe(true);
		expect(isAllowedRedirectUri('other://anysphere/cb', policy)).toBe(false);
	});
});
