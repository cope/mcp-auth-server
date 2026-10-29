'use strict';

import oauthErrorResponse from '../functions/http/oauth.error.response';
import attachAndContinue from '../functions/server/attach.and.continue';
import buildUpstreamContext from '../functions/server/build.upstream.context';
import denyAuthorization from '../functions/server/deny.authorization';
import loadPending from '../functions/server/load.pending';
import type AuthenticatedUserType from '../types/authenticated.user.type';
import type HttpRequestType from '../types/http.request.type';
import type HttpResponseType from '../types/http.response.type';
import type McpAuthContextType from '../types/mcp.auth.context.type';

const resumeHandler = async (context: McpAuthContextType<any>, request: HttpRequestType): Promise<HttpResponseType> => {
	const pending = await loadPending(context, request);
	if (!pending) return oauthErrorResponse(400, 'invalid_request', 'unknown or already used state');

	let user: AuthenticatedUserType | null = null;
	try {
		user = (await context.options.upstream.resume?.(buildUpstreamContext(context, request, pending))) ?? null;
	} catch (error) {
		context.options.logger?.error?.('MCP upstream resume failed', {error: error instanceof Error ? error.message : String(error)});
	}
	return user?.id ? attachAndContinue(context, pending, user) : denyAuthorization(context, pending);
};
export default resumeHandler;
