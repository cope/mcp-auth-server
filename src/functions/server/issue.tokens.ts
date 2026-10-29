'use strict';

import type HttpResponseType from '../../types/http.response.type';
import type McpAuthContextType from '../../types/mcp.auth.context.type';
import randomToken from '../crypto/random.token';
import sha256Hex from '../crypto/sha256.hex';
import jsonResponse from '../http/json.response';
import signAccessToken from '../jwt/sign.access.token';
import tokenFailure from './token.failure';

const issueTokens = async (
	context: McpAuthContextType<any>,
	clientId: string,
	userId: string,
	familyId: string,
	expiresAt: Date,
	parentHash?: string
): Promise<HttpResponseType> => {
	const {storage, resource} = context.options;
	const refreshToken: string = randomToken(32);
	await storage.saveRefreshToken({tokenHash: await sha256Hex(refreshToken), familyId, clientId, userId, resource, expiresAt});
	if (parentHash && (await storage.findRefreshToken(parentHash))?.revokedAt) {
		await storage.revokeRefreshTokenFamily(familyId, context.now());
		return tokenFailure('invalid_grant', 'refresh token was revoked during rotation');
	}
	const accessToken: string = await signAccessToken(await context.getKeys(), {
		issuer: context.issuer,
		resource,
		userId,
		clientId,
		ttlSeconds: context.ttl.accessToken,
		now: context.now()
	});
	return jsonResponse(
		200,
		{access_token: accessToken, token_type: 'Bearer', expires_in: context.ttl.accessToken, refresh_token: refreshToken},
		{'cache-control': 'no-store', pragma: 'no-cache'}
	);
};
export default issueTokens;
