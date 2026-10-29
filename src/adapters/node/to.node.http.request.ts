'use strict';

import type {IncomingMessage} from 'node:http';

import parseQuery from '../../functions/body/parse.query';
import type HttpRequestType from '../../types/http.request.type';
import parseNodeBody from './parse.node.body';

const toNodeHttpRequest = async (req: IncomingMessage, preParsedBody?: unknown): Promise<HttpRequestType> => {
	const url: URL = new URL(req.url ?? '/', 'http://localhost');
	return {
		method: req.method ?? 'GET',
		path: url.pathname,
		query: parseQuery(url.searchParams),
		headers: {...req.headers},
		body: await parseNodeBody(req, preParsedBody),
		ip: req.socket?.remoteAddress
	};
};
export default toNodeHttpRequest;
