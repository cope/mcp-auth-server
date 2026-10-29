'use strict';

import headerValue from '../../../src/functions/http/header.value';

describe('header.value tests', () => {
	it('should be defined', () => {
		expect(headerValue).toBeDefined();
		expect(typeof headerValue).toBe('function');
	});

	it('should return an exact name match', () => {
		expect(headerValue({Authorization: 'Bearer x'}, 'Authorization')).toBe('Bearer x');
	});

	it('should fall back to the lowercase name', () => {
		expect(headerValue({authorization: 'Bearer x'}, 'Authorization')).toBe('Bearer x');
	});

	it('should return the first value of an array', () => {
		expect(headerValue({accept: ['a', 'b']}, 'accept')).toBe('a');
	});

	it('should return undefined when missing', () => {
		expect(headerValue({}, 'accept')).toBeUndefined();
	});
});
