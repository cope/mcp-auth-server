'use strict';

import randomToken from '../functions/crypto/random.token';
import oauthErrorResponse from '../functions/http/oauth.error.response';
import queryParam from '../functions/http/query.param';
import redirectResponse from '../functions/http/redirect.response';
import buildErrorRedirect from '../functions/redirect/build.error.redirect';
import attachAndContinue from '../functions/server/attach.and.continue';
import buildUpstreamContext from '../functions/server/build.upstream.context';
import denyAuthorization from '../functions/server/deny.authorization';
import type HttpRequestType from '../types/http.request.type';
import type HttpResponseType from '../types/http.response.type';
import type McpAuthContextType from '../types/mcp.auth.context.type';
import type PendingAuthorizationType from '../types/pending.authorization.type';

const codeChallengePattern: RegExp = /^[A-Za-z0-9_-]{43}$/;

const authorizeHandler = async (context: McpAuthContextType<any>, request: HttpRequestType): Promise<HttpResponseType> => {
	const {storage, upstream, resource, logger} = context.options;
	const clientId: string | undefined = queryParam(request, 'client_id');
	const client = clientId ? await context.resolveClient(clientId) : ({error: 'unknown client_id'} as const);
	if ('error' in client) return oauthErrorResponse(400, 'invalid_request', client.error);

	const redirectUri: string | undefined = queryParam(request, 'redirect_uri');
	if (!redirectUri || !client.redirectUris.includes(redirectUri)) return oauthErrorResponse(400, 'invalid_request', 'redirect_uri is not registered for this client');

	const clientState: string | undefined = queryParam(request, 'state');
	const fail = (error: string, description: string): HttpResponseType => redirectResponse(buildErrorRedirect(redirectUri, context.issuer, error, description, clientState));

	if ('code' !== queryParam(request, 'response_type')) return fail('unsupported_response_type', 'response_type must be code');
	const codeChallenge: string | undefined = queryParam(request, 'code_challenge');
	if (!codeChallenge || !codeChallengePattern.test(codeChallenge) || 'S256' !== queryParam(request, 'code_challenge_method')) {
		return fail('invalid_request', 'PKCE with code_challenge_method S256 is required');
	}
	if (queryParam(request, 'resource') !== resource) return fail('invalid_target', 'resource does not match this server');

	const pending: PendingAuthorizationType = {
		stateId: randomToken(32),
		clientId: client.clientId,
		clientName: client.clientName,
		redirectUri,
		codeChallenge,
		resource,
		clientState,
		upstreamCodeVerifier: randomToken(32),
		expiresAt: new Date(context.now().getTime() + context.ttl.pending * 1000)
	};
	await storage.savePendingAuthorization(pending);

	try {
		const begun = await upstream.begin(buildUpstreamContext(context, request, pending));
		if ('redirect' === begun.type) return redirectResponse(begun.url);
		return await attachAndContinue(context, pending, begun.user);
	} catch (error) {
		logger?.error?.('MCP upstream begin failed', {error: error instanceof Error ? error.message : String(error)});
		return denyAuthorization(context, pending);
	}
};
export default authorizeHandler;
