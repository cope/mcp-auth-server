'use strict';

import trimTrailingSlashes from '../../../src/functions/http/trim.trailing.slashes';

describe('trim.trailing.slashes tests', () => {
	it('should be defined', () => {
		expect(trimTrailingSlashes).toBeDefined();
		expect(typeof trimTrailingSlashes).toBe('function');
	});

	it('should remove all trailing slashes', () => {
		expect(trimTrailingSlashes('https://example.com///')).toBe('https://example.com');
	});

	it('should leave values without trailing slashes alone', () => {
		expect(trimTrailingSlashes('a/b')).toBe('a/b');
	});

	it('should reduce only slashes to an empty string', () => {
		expect(trimTrailingSlashes('///')).toBe('');
		expect(trimTrailingSlashes('')).toBe('');
	});
});
