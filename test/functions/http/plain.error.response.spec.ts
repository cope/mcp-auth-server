'use strict';

import plainErrorResponse from '../../../src/functions/http/plain.error.response';

describe('plain.error.response tests', () => {
	it('should be defined', () => {
		expect(plainErrorResponse).toBeDefined();
		expect(typeof plainErrorResponse).toBe('function');
	});

	it('should build a plain text no-store response', () => {
		expect(plainErrorResponse(404, 'Not found')).toEqual({status: 404, headers: {'content-type': 'text/plain', 'cache-control': 'no-store'}, body: 'Not found'});
	});
});
