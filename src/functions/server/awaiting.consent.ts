'use strict';

import type HttpRequestType from '../../types/http.request.type';
import type McpAuthContextType from '../../types/mcp.auth.context.type';
import type PendingAuthorizationType from '../../types/pending.authorization.type';
import textValue from '../http/text.value';

const awaitingConsent = async (context: McpAuthContextType<any>, request: HttpRequestType, state: unknown): Promise<PendingAuthorizationType | null> => {
	const stateId: string | undefined = textValue(state);
	const pending = stateId ? await context.options.storage.getPendingAuthorization(stateId, context.now()) : null;
	if (!pending?.userId) return null;
	const {upstream} = context.options;
	if (upstream.verifyUser && !(await upstream.verifyUser(request, pending.userId))) return null;
	return pending;
};
export default awaitingConsent;
