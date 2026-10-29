'use strict';

import type HttpResponseType from '../../types/http.response.type';
import type McpAuthContextType from '../../types/mcp.auth.context.type';
import type PendingAuthorizationType from '../../types/pending.authorization.type';
import plainErrorResponse from '../http/plain.error.response';
import redirectResponse from '../http/redirect.response';
import issueAuthorizationCode from './issue.authorization.code';

const continueWithUser = async (context: McpAuthContextType<any>, pending: PendingAuthorizationType): Promise<HttpResponseType> => {
	const {storage} = context.options;
	if (!(await storage.hasConsent(pending.clientId, pending.userId as string))) {
		return redirectResponse(`${context.issuer}/oauth/consent?state=${encodeURIComponent(pending.stateId)}`);
	}
	const taken = await storage.takePendingAuthorization(pending.stateId, {now: context.now(), hasUser: true});
	return taken ? issueAuthorizationCode(context, taken) : plainErrorResponse(400, 'Invalid or expired authorization request');
};
export default continueWithUser;
