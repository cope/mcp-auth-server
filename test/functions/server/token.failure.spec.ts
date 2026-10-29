'use strict';

import tokenFailure from '../../../src/functions/server/token.failure';

describe('token.failure tests', () => {
	it('should be defined', () => {
		expect(tokenFailure).toBeDefined();
		expect(typeof tokenFailure).toBe('function');
	});

	it('should default to 400 and forbid caching', () => {
		const response = tokenFailure('invalid_grant', 'bad grant');

		expect(response.status).toBe(400);
		expect(response.headers['cache-control']).toBe('no-store');
		expect(response.headers.pragma).toBe('no-cache');
		expect(response.body).toEqual({error: 'invalid_grant', error_description: 'bad grant'});
	});

	it('should honour a custom status', () => {
		expect(tokenFailure('server_error', 'oops', 500).status).toBe(500);
	});
});
