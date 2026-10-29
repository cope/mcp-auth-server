'use strict';

import optionalText from '../../../src/functions/sql/optional.text';

describe('optional.text tests', () => {
	it('should be defined', () => {
		expect(optionalText).toBeDefined();
	});

	it('should return undefined for null and undefined', () => {
		expect(optionalText(null)).toBeUndefined();
		expect(optionalText(undefined)).toBeUndefined();
	});

	it('should convert present values', () => {
		expect(optionalText(42)).toBe('42');
		expect(optionalText('a')).toBe('a');
		expect(optionalText('')).toBe('');
	});
});
