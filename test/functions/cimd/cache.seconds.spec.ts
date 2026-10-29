'use strict';

import cacheSeconds from '../../../src/functions/cimd/cache.seconds';

describe('cache.seconds tests', () => {
	it('should be defined', () => {
		expect(cacheSeconds).toBeDefined();
	});

	it('should return the default when the header is missing', () => {
		expect(cacheSeconds(null, 3600, 300)).toBe(300);
		expect(cacheSeconds('', 3600, 300)).toBe(300);
	});

	it('should return 0 for no-store and no-cache', () => {
		expect(cacheSeconds('no-store', 3600, 300)).toBe(0);
		expect(cacheSeconds('Public, No-Cache', 3600, 300)).toBe(0);
	});

	it('should use max-age', () => {
		expect(cacheSeconds('public, max-age=120', 3600, 300)).toBe(120);
	});

	it('should clamp max-age to the maximum', () => {
		expect(cacheSeconds('max-age=99999', 3600, 300)).toBe(3600);
	});

	it('should return the default without max-age', () => {
		expect(cacheSeconds('public', 3600, 300)).toBe(300);
	});
});
