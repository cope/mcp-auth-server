'use strict';

import type AuthenticateResultType from '../../types/authenticate.result.type';
import type McpAuthContextType from '../../types/mcp.auth.context.type';

const challengeResponse = (context: McpAuthContextType<any>, rpcBody: unknown, tokenSent: boolean, reason: string): AuthenticateResultType<any> => {
	const metadata: string = `resource_metadata="${context.resourceMetadataUrl}"`;
	const id: unknown = rpcBody && 'object' === typeof rpcBody && !Array.isArray(rpcBody) ? ((rpcBody as {id?: unknown}).id ?? null) : null;
	return {
		status: 401,
		reason,
		headers: {'www-authenticate': tokenSent ? `Bearer error="invalid_token", ${metadata}` : `Bearer ${metadata}`, 'content-type': 'application/json'},
		body: {jsonrpc: '2.0', id, error: {code: -32000, message: 'Authentication Required'}}
	};
};
export default challengeResponse;
