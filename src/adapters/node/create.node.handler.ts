'use strict';

import type {IncomingMessage, ServerResponse} from 'node:http';

import type McpAuthType from '../../types/mcp.auth.type';
import toNodeHttpRequest from './to.node.http.request';
import writeNodeResponse from './write.node.response';

const createNodeHandler =
	(auth: McpAuthType<any>) =>
	async (req: IncomingMessage, res: ServerResponse): Promise<boolean> => {
		const url: URL = new URL(req.url ?? '/', 'http://localhost');
		if (!auth.hasRoute({method: req.method ?? 'GET', path: url.pathname, query: {}, headers: {}})) return false;
		writeNodeResponse(res, await auth.handle(await toNodeHttpRequest(req)));
		return true;
	};
export default createNodeHandler;
