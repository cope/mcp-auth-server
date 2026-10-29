'use strict';

import isLoopbackRedirect from '../../../src/functions/redirect/is.loopback.redirect';

describe('is.loopback.redirect tests', () => {
	it('should be defined', () => {
		expect(isLoopbackRedirect).toBeDefined();
		expect(typeof isLoopbackRedirect).toBe('function');
	});

	it('should return false for an invalid url', () => {
		expect(isLoopbackRedirect('nope')).toBe(false);
	});

	it('should return true for http loopback hosts', () => {
		expect(isLoopbackRedirect('http://localhost:3000/cb')).toBe(true);
		expect(isLoopbackRedirect('http://127.0.0.1/cb')).toBe(true);
	});

	it('should return false for https loopback', () => {
		expect(isLoopbackRedirect('https://localhost/cb')).toBe(false);
	});

	it('should return false for non loopback http hosts', () => {
		expect(isLoopbackRedirect('http://example.com/cb')).toBe(false);
	});
});
