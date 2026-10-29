'use strict';

import type AuthenticateResultType from '../../types/authenticate.result.type';
import type HttpRequestType from '../../types/http.request.type';
import type McpAuthContextType from '../../types/mcp.auth.context.type';
import headerValue from '../http/header.value';
import textValue from '../http/text.value';
import verifyAccessToken from '../jwt/verify.access.token';
import challengeResponse from './challenge.response';

const authenticateRequest = async <TUser>(context: McpAuthContextType<TUser>, headers: HttpRequestType['headers'], rpcBody?: unknown): Promise<AuthenticateResultType<TUser>> => {
	const bearer: string | undefined = /^Bearer (\S+)$/i.exec(headerValue(headers, 'authorization') ?? '')?.[1];
	if (!bearer) return challengeResponse(context, rpcBody, false, 'missing_token');

	const verified = await verifyAccessToken(await context.getKeys(), bearer, context.issuer, context.options.resource, context.now());
	if ('reason' in verified) return challengeResponse(context, rpcBody, true, verified.reason);

	const subject: string | undefined = textValue(verified.claims.sub);
	const user = subject ? await context.options.loadActiveUser(subject) : null;
	if (!user) return challengeResponse(context, rpcBody, true, 'user_inactive');
	return {user, claims: verified.claims};
};
export default authenticateRequest;
