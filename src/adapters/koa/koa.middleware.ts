'use strict';

import type {Context, Next} from 'koa';

import type McpAuthType from '../../types/mcp.auth.type';
import toNodeHttpRequest from '../node/to.node.http.request';

const koaMiddleware =
	(auth: McpAuthType<any>) =>
	async (ctx: Context, next: Next): Promise<void> => {
		if (!auth.hasRoute({method: ctx.method, path: ctx.path, query: {}, headers: {}})) return next();
		const body: unknown = (ctx.request as {body?: unknown}).body;
		const preParsed: unknown = body && 'object' === typeof body && Object.keys(body).length > 0 ? body : undefined;
		const parsed = await toNodeHttpRequest(ctx.req, preParsed);
		const response = await auth.handle({...parsed, path: ctx.path});
		ctx.status = response.status;
		ctx.set(response.headers);
		ctx.body = response.body ?? '';
	};
export default koaMiddleware;
