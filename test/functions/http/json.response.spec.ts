'use strict';

import jsonResponse from '../../../src/functions/http/json.response';

describe('json.response tests', () => {
	it('should be defined', () => {
		expect(jsonResponse).toBeDefined();
		expect(typeof jsonResponse).toBe('function');
	});

	it('should build a json response with default headers', () => {
		expect(jsonResponse(200, {ok: true})).toEqual({status: 200, headers: {'content-type': 'application/json'}, body: {ok: true}});
	});

	it('should merge and allow overriding headers', () => {
		const response = jsonResponse(201, {}, {'cache-control': 'no-store', 'content-type': 'application/custom+json'});

		expect(response.headers).toEqual({'content-type': 'application/custom+json', 'cache-control': 'no-store'});
	});
});
