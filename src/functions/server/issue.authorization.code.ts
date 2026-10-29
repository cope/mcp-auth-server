'use strict';

import type HttpResponseType from '../../types/http.response.type';
import type McpAuthContextType from '../../types/mcp.auth.context.type';
import type PendingAuthorizationType from '../../types/pending.authorization.type';
import randomToken from '../crypto/random.token';
import sha256Hex from '../crypto/sha256.hex';
import buildRedirect from '../redirect/build.redirect';
import redirectResponse from '../http/redirect.response';

const issueAuthorizationCode = async (context: McpAuthContextType<any>, pending: PendingAuthorizationType): Promise<HttpResponseType> => {
	const code: string = randomToken(32);
	await context.options.storage.saveAuthorizationCode({
		codeHash: await sha256Hex(code),
		clientId: pending.clientId,
		redirectUri: pending.redirectUri,
		codeChallenge: pending.codeChallenge,
		resource: pending.resource,
		userId: pending.userId as string,
		expiresAt: new Date(context.now().getTime() + context.ttl.code * 1000)
	});
	return redirectResponse(buildRedirect(pending.redirectUri, context.issuer, {code, state: pending.clientState}));
};
export default issueAuthorizationCode;
