'use strict';

import describeRedirectTarget from '../../../src/functions/redirect/describe.redirect.target';

describe('describe.redirect.target tests', () => {
	it('should be defined', () => {
		expect(describeRedirectTarget).toBeDefined();
		expect(typeof describeRedirectTarget).toBe('function');
	});

	it('should return only the host for http and https', () => {
		expect(describeRedirectTarget('https://app.example.com:8443/cb')).toBe('app.example.com:8443');
		expect(describeRedirectTarget('http://localhost:3000/cb')).toBe('localhost:3000');
	});

	it('should include the scheme for custom schemes', () => {
		expect(describeRedirectTarget('cursor://anysphere.cursor/cb')).toBe('cursor://anysphere.cursor');
	});

	it('should throw for an invalid uri', () => {
		expect(() => describeRedirectTarget('nope')).toThrow();
	});
});
