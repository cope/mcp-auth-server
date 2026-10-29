'use strict';

import type HttpResponseType from '../../types/http.response.type';
import type McpAuthContextType from '../../types/mcp.auth.context.type';
import type PendingAuthorizationType from '../../types/pending.authorization.type';
import redirectResponse from '../http/redirect.response';
import buildErrorRedirect from '../redirect/build.error.redirect';

const denyAuthorization = async (context: McpAuthContextType<any>, pending: PendingAuthorizationType, description: string = 'sign-in failed'): Promise<HttpResponseType> => {
	await context.options.storage.deletePendingAuthorization(pending.stateId);
	return redirectResponse(buildErrorRedirect(pending.redirectUri, context.issuer, 'access_denied', description, pending.clientState));
};
export default denyAuthorization;
