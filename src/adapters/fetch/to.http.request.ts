'use strict';

import parseBody from '../../functions/body/parse.body';
import parseQuery from '../../functions/body/parse.query';
import type HttpRequestType from '../../types/http.request.type';

const toHttpRequest = async (request: Request): Promise<HttpRequestType> => {
	const url: URL = new URL(request.url);
	const headers: Record<string, string> = Object.fromEntries(request.headers.entries());
	const raw: string = 'GET' === request.method || 'HEAD' === request.method ? '' : await request.text();
	return {
		method: request.method,
		path: url.pathname,
		query: parseQuery(url.searchParams),
		headers,
		body: parseBody(headers['content-type'], raw),
		ip: headers['cf-connecting-ip'] ?? headers['x-real-ip'] ?? headers['x-forwarded-for']?.split(',')[0]?.trim()
	};
};
export default toHttpRequest;
