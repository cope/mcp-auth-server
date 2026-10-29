'use strict';

import redirectResponse from '../../../src/functions/http/redirect.response';

describe('redirect.response tests', () => {
	it('should be defined', () => {
		expect(redirectResponse).toBeDefined();
		expect(typeof redirectResponse).toBe('function');
	});

	it('should build a 302 no-store redirect', () => {
		expect(redirectResponse('https://example.com/next')).toEqual({status: 302, headers: {location: 'https://example.com/next', 'cache-control': 'no-store'}});
	});
});
