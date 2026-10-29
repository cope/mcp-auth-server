'use strict';

import type {ServerResponse} from 'node:http';

import type HttpResponseType from '../../types/http.response.type';

const writeNodeResponse = (res: ServerResponse, response: HttpResponseType): void => {
	const body: unknown = response.body;
	const payload: string | undefined = undefined === body || 'string' === typeof body ? (body as string | undefined) : JSON.stringify(body);
	res.writeHead(response.status, response.headers);
	res.end(payload);
};
export default writeNodeResponse;
