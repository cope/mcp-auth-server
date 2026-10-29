'use strict';

import textValue from '../../../src/functions/http/text.value';

describe('text.value tests', () => {
	it('should be defined', () => {
		expect(textValue).toBeDefined();
		expect(typeof textValue).toBe('function');
	});

	it('should return non empty strings', () => {
		expect(textValue('abc')).toBe('abc');
	});

	it('should return undefined for empty strings and non strings', () => {
		expect(textValue('')).toBeUndefined();
		expect(textValue(5)).toBeUndefined();
		expect(textValue(null)).toBeUndefined();
	});
});
