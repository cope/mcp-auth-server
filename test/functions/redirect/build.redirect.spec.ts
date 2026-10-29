'use strict';

import buildRedirect from '../../../src/functions/redirect/build.redirect';

describe('build.redirect tests', () => {
	it('should be defined', () => {
		expect(buildRedirect).toBeDefined();
		expect(typeof buildRedirect).toBe('function');
	});

	it('should append truthy params and iss', () => {
		const url = new URL(buildRedirect('https://app.example/cb', 'https://issuer', {code: 'abc', state: 'xyz'}));

		expect(url.searchParams.get('code')).toBe('abc');
		expect(url.searchParams.get('state')).toBe('xyz');
		expect(url.searchParams.get('iss')).toBe('https://issuer');
	});

	it('should skip undefined and empty params', () => {
		const url = new URL(buildRedirect('https://app.example/cb', 'https://issuer', {code: undefined, state: ''}));

		expect(url.searchParams.has('code')).toBe(false);
		expect(url.searchParams.has('state')).toBe(false);
	});

	it('should preserve existing query parameters', () => {
		const url = new URL(buildRedirect('https://app.example/cb?x=1', 'https://issuer', {}));

		expect(url.searchParams.get('x')).toBe('1');
	});

	it('should throw for an invalid redirect uri', () => {
		expect(() => buildRedirect('nope', 'https://issuer', {})).toThrow();
	});
});
