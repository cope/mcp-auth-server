'use strict';

import type HttpRequestType from '../../types/http.request.type';
import type McpAuthContextType from '../../types/mcp.auth.context.type';
import type PendingAuthorizationType from '../../types/pending.authorization.type';
import type UpstreamContextType from '../../types/upstream.context.type';

const buildUpstreamContext = (context: McpAuthContextType<any>, request: HttpRequestType, pending: PendingAuthorizationType): UpstreamContextType => ({
	request,
	pending,
	issuer: context.issuer,
	callbackUrl: `${context.issuer}${context.callbackPath}`,
	resumeUrl: `${context.issuer}/oauth/resume?state=${encodeURIComponent(pending.stateId)}`
});
export default buildUpstreamContext;
