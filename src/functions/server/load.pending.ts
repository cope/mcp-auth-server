'use strict';

import type HttpRequestType from '../../types/http.request.type';
import type McpAuthContextType from '../../types/mcp.auth.context.type';
import type PendingAuthorizationType from '../../types/pending.authorization.type';
import queryParam from '../http/query.param';

const loadPending = async (context: McpAuthContextType<any>, request: HttpRequestType): Promise<PendingAuthorizationType | null> => {
	const state: string | undefined = queryParam(request, 'state');
	const pending = state ? await context.options.storage.getPendingAuthorization(state, context.now()) : null;
	return pending && !pending.userId ? pending : null;
};
export default loadPending;
