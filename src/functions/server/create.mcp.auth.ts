'use strict';

import type HttpRequestType from '../../types/http.request.type';
import type McpAuthOptionsType from '../../types/mcp.auth.options.type';
import type McpAuthType from '../../types/mcp.auth.type';
import authenticateRequest from './authenticate.request';
import buildRoutes from './build.routes';
import createMcpAuthContext from './create.mcp.auth.context';
import findRoute from './find.route';
import handleRequest from './handle.request';

const createMcpAuth = <TUser = unknown>(options: McpAuthOptionsType<TUser>): McpAuthType<TUser> => {
	const context = createMcpAuthContext(options);
	const routes = buildRoutes(context);

	return {
		issuer: context.issuer,
		resource: options.resource,
		routes,
		hasRoute: (request: HttpRequestType): boolean => !!findRoute(routes, request),
		handle: (request: HttpRequestType) => handleRequest(context, routes, request),
		authenticate: (headers: HttpRequestType['headers'], rpcBody?: unknown) => authenticateRequest(context, headers, rpcBody),
		deleteExpired: (): Promise<void> => options.storage.deleteExpired(context.now())
	};
};
export default createMcpAuth;
