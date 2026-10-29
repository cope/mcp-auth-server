'use strict';

import oauthErrorResponse from '../functions/http/oauth.error.response';
import textValue from '../functions/http/text.value';
import attachAndContinue from '../functions/server/attach.and.continue';
import buildUpstreamContext from '../functions/server/build.upstream.context';
import denyAuthorization from '../functions/server/deny.authorization';
import loadPending from '../functions/server/load.pending';
import type AuthenticatedUserType from '../types/authenticated.user.type';
import type HttpRequestType from '../types/http.request.type';
import type HttpResponseType from '../types/http.response.type';
import type McpAuthContextType from '../types/mcp.auth.context.type';

const callbackHandler = async (context: McpAuthContextType<any>, request: HttpRequestType): Promise<HttpResponseType> => {
	const pending = await loadPending(context, request);
	if (!pending) return oauthErrorResponse(400, 'invalid_request', 'unknown or already used state');

	const {upstream, resolveUser, logger} = context.options;
	let user: AuthenticatedUserType | undefined;
	try {
		const claims = await upstream.callback?.(buildUpstreamContext(context, request, pending));
		const subject: string | undefined = textValue(claims?.sub);
		if (claims && resolveUser) user = await resolveUser(claims);
		else if (claims && subject) user = {id: subject, displayName: textValue(claims.name)};
	} catch (error) {
		logger?.error?.('MCP upstream callback failed', {error: error instanceof Error ? error.message : String(error)});
	}
	return user?.id ? attachAndContinue(context, pending, user) : denyAuthorization(context, pending);
};
export default callbackHandler;
