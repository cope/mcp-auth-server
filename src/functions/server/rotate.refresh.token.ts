'use strict';

import type HttpResponseType from '../../types/http.response.type';
import type McpAuthContextType from '../../types/mcp.auth.context.type';
import sha256Hex from '../crypto/sha256.hex';
import textValue from '../http/text.value';
import issueTokens from './issue.tokens';
import tokenFailure from './token.failure';

const rotateRefreshToken = async (context: McpAuthContextType<any>, params: Record<string, unknown>): Promise<HttpResponseType> => {
	const refreshToken: string | undefined = textValue(params.refresh_token);
	const clientId: string | undefined = textValue(params.client_id);
	if (!refreshToken || !clientId) return tokenFailure('invalid_request', 'refresh_token and client_id are required');

	const {storage} = context.options;
	const tokenHash: string = await sha256Hex(refreshToken);
	const stored = await storage.findRefreshToken(tokenHash);
	const at: Date = context.now();
	if (!stored || stored.clientId !== clientId || stored.expiresAt <= at) return tokenFailure('invalid_grant', 'refresh token is invalid, expired or revoked');
	if (stored.revokedAt) {
		await storage.revokeRefreshTokenFamily(stored.familyId, at);
		return tokenFailure('invalid_grant', 'refresh token is invalid, expired or revoked');
	}

	const claimed = await storage.claimRefreshToken(tokenHash, at);
	if (!claimed) {
		await storage.revokeRefreshTokenFamily(stored.familyId, at);
		return tokenFailure('invalid_grant', 'refresh token was already used; all tokens of this session are revoked');
	}
	return issueTokens(context, clientId, stored.userId, stored.familyId, stored.expiresAt, tokenHash);
};
export default rotateRefreshToken;
