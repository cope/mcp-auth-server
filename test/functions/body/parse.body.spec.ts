'use strict';

import parseBody from '../../../src/functions/body/parse.body';

describe('parse.body tests', () => {
	it('should be defined', () => {
		expect(parseBody).toBeDefined();
		expect(typeof parseBody).toBe('function');
	});

	it('should return undefined for an empty body', () => {
		expect(parseBody('application/json', '')).toBeUndefined();
	});

	it('should parse form encoded bodies', () => {
		expect(parseBody('Application/X-WWW-Form-Urlencoded; charset=utf-8', 'a=1&b=two')).toEqual({a: '1', b: 'two'});
	});

	it('should parse json bodies', () => {
		expect(parseBody('application/json', '{"a":1}')).toEqual({a: 1});
	});

	it('should parse json when the content type is missing', () => {
		expect(parseBody(undefined, '{"a":1}')).toEqual({a: 1});
	});

	it('should return undefined for invalid json', () => {
		expect(parseBody('application/json', '{oops')).toBeUndefined();
	});

	it('should return undefined for unsupported content types', () => {
		expect(parseBody('text/plain', 'hello')).toBeUndefined();
	});
});
