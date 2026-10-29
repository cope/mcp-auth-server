'use strict';

import type AuthenticateResultType from './authenticate.result.type';
import type HttpRequestType from './http.request.type';
import type HttpResponseType from './http.response.type';
import type RouteType from './route.type';

type McpAuthType<TUser = unknown> = {
	issuer: string;
	resource: string;
	routes: RouteType[];
	hasRoute: (request: HttpRequestType) => boolean;
	handle: (request: HttpRequestType) => Promise<HttpResponseType>;
	authenticate: (headers: HttpRequestType['headers'], rpcBody?: unknown) => Promise<AuthenticateResultType<TUser>>;
	deleteExpired: () => Promise<void>;
};
export default McpAuthType;
