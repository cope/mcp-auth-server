'use strict';

import type HttpResponseType from '../../types/http.response.type';
import type McpAuthContextType from '../../types/mcp.auth.context.type';
import randomId from '../crypto/random.id';
import sha256Base64Url from '../crypto/sha256.base64.url';
import sha256Hex from '../crypto/sha256.hex';
import textValue from '../http/text.value';
import issueTokens from './issue.tokens';
import tokenFailure from './token.failure';

const codeVerifierPattern: RegExp = /^[A-Za-z0-9\-._~]{43,128}$/;

const exchangeAuthorizationCode = async (context: McpAuthContextType<any>, params: Record<string, unknown>): Promise<HttpResponseType> => {
	const [code, clientId, redirectUri, codeVerifier, resource] = ['code', 'client_id', 'redirect_uri', 'code_verifier', 'resource'].map((name: string): string | undefined =>
		textValue(params[name])
	);
	if (!code || !clientId || !redirectUri || !codeVerifier) return tokenFailure('invalid_request', 'code, client_id, redirect_uri and code_verifier are required');
	if (!codeVerifierPattern.test(codeVerifier)) return tokenFailure('invalid_grant', 'code_verifier is malformed');

	const claimedAt: Date = context.now();
	const stored = await context.options.storage.claimAuthorizationCode(await sha256Hex(code), claimedAt);
	if (!stored) return tokenFailure('invalid_grant', 'authorization code is invalid, expired or already used');

	if (
		stored.clientId !== clientId ||
		stored.redirectUri !== redirectUri ||
		stored.codeChallenge !== (await sha256Base64Url(codeVerifier)) ||
		(resource && stored.resource !== resource)
	) {
		return tokenFailure('invalid_grant', 'authorization code does not match the request');
	}
	return issueTokens(context, clientId, stored.userId, randomId(), new Date(claimedAt.getTime() + context.ttl.refreshToken * 1000));
};
export default exchangeAuthorizationCode;
