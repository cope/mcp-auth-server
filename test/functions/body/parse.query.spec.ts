'use strict';

import parseQuery from '../../../src/functions/body/parse.query';

describe('parse.query tests', () => {
	it('should be defined', () => {
		expect(parseQuery).toBeDefined();
		expect(typeof parseQuery).toBe('function');
	});

	it('should parse a query string', () => {
		expect(parseQuery('a=1&b=2')).toEqual({a: '1', b: '2'});
	});

	it('should accept URLSearchParams', () => {
		expect(parseQuery(new URLSearchParams('a=1'))).toEqual({a: '1'});
	});

	it('should collect repeated keys into arrays', () => {
		expect(parseQuery('a=1&a=2&a=3')).toEqual({a: ['1', '2', '3']});
	});

	it('should return an empty object for an empty query', () => {
		expect(parseQuery('')).toEqual({});
	});
});
