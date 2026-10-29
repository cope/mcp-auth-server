'use strict';

import type HttpRequestType from '../../types/http.request.type';
import type HttpResponseType from '../../types/http.response.type';
import type McpAuthContextType from '../../types/mcp.auth.context.type';
import type RouteNameType from '../../types/route.name.type';
import type RouteType from '../../types/route.type';
import jsonResponse from '../http/json.response';
import oauthErrorResponse from '../http/oauth.error.response';
import findRoute from './find.route';

const limited: RouteNameType[] = ['register', 'token', 'revoke'];

const handleRequest = async (context: McpAuthContextType<any>, routes: RouteType[], request: HttpRequestType): Promise<HttpResponseType> => {
	const route: RouteType | undefined = findRoute(routes, request);
	if (!route) return jsonResponse(404, {error: 'not_found'});
	const {rateLimit} = context.options;
	if (rateLimit && limited.includes(route.name) && !(await rateLimit(request.ip ?? 'unknown', route.name))) {
		return oauthErrorResponse(429, 'rate_limited', 'too many requests', {'retry-after': '60'});
	}
	return route.handler(request);
};
export default handleRequest;
