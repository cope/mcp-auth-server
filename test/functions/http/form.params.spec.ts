'use strict';

import formParams from '../../../src/functions/http/form.params';

describe('form.params tests', () => {
	it('should be defined', () => {
		expect(formParams).toBeDefined();
		expect(typeof formParams).toBe('function');
	});

	it('should return objects as is', () => {
		const body = {a: 1};

		expect(formParams(body)).toBe(body);
	});

	it('should return an empty object for non objects', () => {
		expect(formParams(undefined)).toEqual({});
		expect(formParams(null)).toEqual({});
		expect(formParams('text')).toEqual({});
	});
});
