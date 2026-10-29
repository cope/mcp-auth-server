'use strict';

import trimTrailingSlashes from '../http/trim.trailing.slashes';
import authorizationServerMetadataHandler from '../../handlers/authorization.server.metadata.handler';
import authorizeHandler from '../../handlers/authorize.handler';
import callbackHandler from '../../handlers/callback.handler';
import consentDecisionHandler from '../../handlers/consent.decision.handler';
import consentPageHandler from '../../handlers/consent.page.handler';
import protectedResourceMetadataHandler from '../../handlers/protected.resource.metadata.handler';
import registerHandler from '../../handlers/register.handler';
import resumeHandler from '../../handlers/resume.handler';
import revokeHandler from '../../handlers/revoke.handler';
import tokenHandler from '../../handlers/token.handler';
import type HttpRequestType from '../../types/http.request.type';
import type McpAuthContextType from '../../types/mcp.auth.context.type';
import type RouteType from '../../types/route.type';

const buildRoutes = (context: McpAuthContextType<any>): RouteType[] => {
	const {basePath, callbackPath} = context;
	const {upstream, resource} = context.options;
	const resourcePath: string = trimTrailingSlashes(new URL(resource).pathname);
	const withRequest =
		(handler: (context: McpAuthContextType<any>, request: HttpRequestType) => ReturnType<RouteType['handler']>): RouteType['handler'] =>
		(request) =>
			handler(context, request);
	const metadata = (path: string, handler: RouteType['handler']): RouteType => ({method: 'GET', path, name: 'metadata', handler});
	const protectedResource: RouteType['handler'] = () => protectedResourceMetadataHandler(context);
	const authorizationServer: RouteType['handler'] = () => authorizationServerMetadataHandler(context);

	return [
		metadata('/.well-known/oauth-protected-resource', protectedResource),
		...(resourcePath ? [metadata(`/.well-known/oauth-protected-resource${resourcePath}`, protectedResource)] : []),
		...['/.well-known/oauth-authorization-server', '/.well-known/openid-configuration'].flatMap((path: string): RouteType[] =>
			[...new Set([path, `${path}${basePath}`, `${basePath}${path}`])].map((full: string): RouteType => metadata(full, authorizationServer))
		),
		...(context.registrationEnabled ? [{method: 'POST', path: `${basePath}/register`, name: 'register', handler: withRequest(registerHandler)} as RouteType] : []),
		{method: 'GET', path: `${basePath}/authorize`, name: 'authorize', handler: withRequest(authorizeHandler)},
		...(upstream.callback ? [{method: 'GET', path: `${basePath}${callbackPath}`, name: 'callback', handler: withRequest(callbackHandler)} as RouteType] : []),
		...(upstream.resume ? [{method: 'GET', path: `${basePath}/oauth/resume`, name: 'resume', handler: withRequest(resumeHandler)} as RouteType] : []),
		{method: 'GET', path: `${basePath}/oauth/consent`, name: 'consent', handler: withRequest(consentPageHandler)},
		{method: 'POST', path: `${basePath}/oauth/consent`, name: 'consent', handler: withRequest(consentDecisionHandler)},
		{method: 'POST', path: `${basePath}/token`, name: 'token', handler: withRequest(tokenHandler)},
		{method: 'POST', path: `${basePath}/revoke`, name: 'revoke', handler: withRequest(revokeHandler)}
	];
};
export default buildRoutes;
