'use strict';

import isMetadataClientId from '../functions/cimd/is.metadata.client.id';
import plainErrorResponse from '../functions/http/plain.error.response';
import queryParam from '../functions/http/query.param';
import describeRedirectTarget from '../functions/redirect/describe.redirect.target';
import isLoopbackRedirect from '../functions/redirect/is.loopback.redirect';
import awaitingConsent from '../functions/server/awaiting.consent';
import type ConsentModelType from '../types/consent.model.type';
import type HttpRequestType from '../types/http.request.type';
import type HttpResponseType from '../types/http.response.type';
import type McpAuthContextType from '../types/mcp.auth.context.type';

const consentPageHandler = async (context: McpAuthContextType<any>, request: HttpRequestType): Promise<HttpResponseType> => {
	const pending = await awaitingConsent(context, request, queryParam(request, 'state'));
	if (!pending) return plainErrorResponse(400, 'Invalid or expired authorization request');

	const metadataDocument: boolean = isMetadataClientId(pending.clientId);
	const model: ConsentModelType = {
		action: `${context.basePath}/oauth/consent`,
		state: pending.stateId,
		clientId: pending.clientId,
		clientName: pending.clientName,
		clientHost: metadataDocument ? new URL(pending.clientId).host : undefined,
		metadataDocument,
		redirectUri: pending.redirectUri,
		redirectTarget: describeRedirectTarget(pending.redirectUri),
		redirectIsLocalhost: isLoopbackRedirect(pending.redirectUri),
		userDisplayName: pending.userDisplayName,
		productName: context.productName,
		environmentLabel: context.options.environmentLabel
	};
	return {
		status: 200,
		headers: {
			'content-type': 'text/html; charset=utf-8',
			'x-frame-options': 'DENY',
			'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
			'cache-control': 'no-store'
		},
		body: context.renderConsent(model)
	};
};
export default consentPageHandler;
