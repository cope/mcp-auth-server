'use strict';

import optionalNumber from '../../../src/functions/sql/optional.number';

describe('optional.number tests', () => {
	it('should be defined', () => {
		expect(optionalNumber).toBeDefined();
	});

	it('should return undefined for null and undefined', () => {
		expect(optionalNumber(null)).toBeUndefined();
		expect(optionalNumber(undefined)).toBeUndefined();
	});

	it('should convert present values', () => {
		expect(optionalNumber('42')).toBe(42);
		expect(optionalNumber(7)).toBe(7);
		expect(optionalNumber(0)).toBe(0);
	});
});
