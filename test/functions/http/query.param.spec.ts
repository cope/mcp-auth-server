'use strict';

import queryParam from '../../../src/functions/http/query.param';

describe('query.param tests', () => {
	const request = {method: 'GET', path: '/', headers: {}, query: {a: 'x', b: ['1', '2']}};

	it('should be defined', () => {
		expect(queryParam).toBeDefined();
		expect(typeof queryParam).toBe('function');
	});

	it('should return string values', () => {
		expect(queryParam(request, 'a')).toBe('x');
	});

	it('should return undefined for array values', () => {
		expect(queryParam(request, 'b')).toBeUndefined();
	});

	it('should return undefined when missing', () => {
		expect(queryParam(request, 'c')).toBeUndefined();
	});
});
