'use strict';

import formParams from '../functions/http/form.params';
import plainErrorResponse from '../functions/http/plain.error.response';
import redirectResponse from '../functions/http/redirect.response';
import buildErrorRedirect from '../functions/redirect/build.error.redirect';
import awaitingConsent from '../functions/server/awaiting.consent';
import issueAuthorizationCode from '../functions/server/issue.authorization.code';
import type HttpRequestType from '../types/http.request.type';
import type HttpResponseType from '../types/http.response.type';
import type McpAuthContextType from '../types/mcp.auth.context.type';

const consentDecisionHandler = async (context: McpAuthContextType<any>, request: HttpRequestType): Promise<HttpResponseType> => {
	const invalid = (): HttpResponseType => plainErrorResponse(400, 'Invalid or expired authorization request');
	const body: Record<string, unknown> = formParams(request.body);
	const decision: unknown = body.decision;
	if ('approve' !== decision && 'deny' !== decision) return invalid();
	if (!(await awaitingConsent(context, request, body.state))) return invalid();

	const {storage} = context.options;
	const pending = await storage.takePendingAuthorization(body.state as string, {now: context.now(), hasUser: true});
	if (!pending) return invalid();

	if ('deny' === decision) return redirectResponse(buildErrorRedirect(pending.redirectUri, context.issuer, 'access_denied', 'the user denied the request', pending.clientState));

	await storage.upsertConsent({clientId: pending.clientId, userId: pending.userId as string});
	return issueAuthorizationCode(context, pending);
};
export default consentDecisionHandler;
