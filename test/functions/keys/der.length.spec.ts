'use strict';

import derLength from '../../../src/functions/keys/der.length';

describe('der.length tests', () => {
	it('should be defined', () => {
		expect(derLength).toBeDefined();
		expect(typeof derLength).toBe('function');
	});

	it('should use short form below 128', () => {
		expect(derLength(0)).toEqual([0]);
		expect(derLength(127)).toEqual([127]);
	});

	it('should use long form with one length byte', () => {
		expect(derLength(128)).toEqual([0x81, 128]);
		expect(derLength(255)).toEqual([0x81, 255]);
	});

	it('should use long form with two length bytes', () => {
		expect(derLength(256)).toEqual([0x82, 1, 0]);
		expect(derLength(1218)).toEqual([0x82, 4, 194]);
	});
});
