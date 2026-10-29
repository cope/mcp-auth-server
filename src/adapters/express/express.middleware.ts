'use strict';

import type {NextFunction, Request, RequestHandler, Response} from 'express';

import type McpAuthType from '../../types/mcp.auth.type';
import toNodeHttpRequest from '../node/to.node.http.request';
import writeNodeResponse from '../node/write.node.response';

const expressMiddleware =
	(auth: McpAuthType<any>): RequestHandler =>
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const originalUrl: string = req.originalUrl ?? req.url;
		const path: string = new URL(originalUrl, 'http://localhost').pathname;
		if (!auth.hasRoute({method: req.method, path, query: {}, headers: {}})) return next();
		try {
			const preParsed: unknown = req.body && 'object' === typeof req.body && Object.keys(req.body).length > 0 ? req.body : undefined;
			const parsed = await toNodeHttpRequest(Object.assign(req, {url: originalUrl}), preParsed);
			writeNodeResponse(res, await auth.handle(parsed));
		} catch (error) {
			next(error);
		}
	};
export default expressMiddleware;
