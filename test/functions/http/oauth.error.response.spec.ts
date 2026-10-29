'use strict';

import jsonResponse from '../../../src/functions/http/json.response';
import oauthErrorResponse from '../../../src/functions/http/oauth.error.response';

jest.mock('../../../src/functions/http/json.response');

const mockJsonResponse = jsonResponse as jest.MockedFunction<typeof jsonResponse>;

describe('oauth.error.response tests', () => {
	it('should be defined', () => {
		expect(oauthErrorResponse).toBeDefined();
		expect(typeof oauthErrorResponse).toBe('function');
	});

	it('should delegate to jsonResponse with the oauth error body', () => {
		const expected = {status: 400, headers: {}};
		mockJsonResponse.mockReturnValue(expected);

		expect(oauthErrorResponse(400, 'invalid_request', 'bad', {'x-a': 'b'})).toBe(expected);
		expect(mockJsonResponse).toHaveBeenCalledWith(400, {error: 'invalid_request', error_description: 'bad'}, {'x-a': 'b'});
	});

	it('should default headers to an empty object', () => {
		oauthErrorResponse(400, 'invalid_request', 'bad');

		expect(mockJsonResponse).toHaveBeenCalledWith(400, {error: 'invalid_request', error_description: 'bad'}, {});
	});
});
