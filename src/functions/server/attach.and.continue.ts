'use strict';

import type AuthenticatedUserType from '../../types/authenticated.user.type';
import type HttpResponseType from '../../types/http.response.type';
import type McpAuthContextType from '../../types/mcp.auth.context.type';
import type PendingAuthorizationType from '../../types/pending.authorization.type';
import oauthErrorResponse from '../http/oauth.error.response';
import continueWithUser from './continue.with.user';

const attachAndContinue = async (context: McpAuthContextType<any>, pending: PendingAuthorizationType, user: AuthenticatedUserType): Promise<HttpResponseType> => {
	const attached = await context.options.storage.attachUserToPendingAuthorization(pending.stateId, user.id, context.now(), user.displayName);
	if (!attached) return oauthErrorResponse(400, 'invalid_request', 'unknown or already used state');
	return continueWithUser(context, attached);
};
export default attachAndContinue;
