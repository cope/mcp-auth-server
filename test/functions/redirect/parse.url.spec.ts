'use strict';

import parseUrl from '../../../src/functions/redirect/parse.url';

describe('parse.url tests', () => {
	it('should be defined', () => {
		expect(parseUrl).toBeDefined();
		expect(typeof parseUrl).toBe('function');
	});

	it('should return null for non strings', () => {
		expect(parseUrl(undefined)).toBeNull();
		expect(parseUrl(42)).toBeNull();
	});

	it('should return null for an invalid url', () => {
		expect(parseUrl('not a url')).toBeNull();
	});

	it('should return a URL for a valid string', () => {
		expect(parseUrl('https://example.com/a')?.hostname).toBe('example.com');
	});
});
