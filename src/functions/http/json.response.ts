'use strict';

import type HttpResponseType from '../../types/http.response.type';

const jsonResponse = (status: number, body: unknown, headers: Record<string, string> = {}): HttpResponseType => ({
	status,
	headers: {'content-type': 'application/json', ...headers},
	body
});
export default jsonResponse;
