'use strict';

import type HttpResponseType from '../../types/http.response.type';

const toResponse = (response: HttpResponseType): Response => {
	const body: unknown = response.body;
	if (undefined === body) return new Response(null, {status: response.status, headers: response.headers});
	return new Response('string' === typeof body ? body : JSON.stringify(body), {status: response.status, headers: response.headers});
};
export default toResponse;
