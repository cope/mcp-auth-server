'use strict';

import sha256Hex from '../functions/crypto/sha256.hex';
import formParams from '../functions/http/form.params';
import jsonResponse from '../functions/http/json.response';
import textValue from '../functions/http/text.value';
import hasCredentials from '../functions/server/has.credentials';
import tokenFailure from '../functions/server/token.failure';
import type HttpRequestType from '../types/http.request.type';
import type HttpResponseType from '../types/http.response.type';
import type McpAuthContextType from '../types/mcp.auth.context.type';

const revokeHandler = async (context: McpAuthContextType<any>, request: HttpRequestType): Promise<HttpResponseType> => {
	const params: Record<string, unknown> = formParams(request.body);
	if (hasCredentials(request, params)) return tokenFailure('invalid_client', 'public clients must not send credentials', 401);

	const value: string | undefined = textValue(params.token);
	const clientId: string | undefined = textValue(params.client_id);
	if (!value || !clientId) return tokenFailure('invalid_request', 'token and client_id are required');

	const {storage} = context.options;
	const stored = await storage.findRefreshToken(await sha256Hex(value));
	if (stored && stored.clientId === clientId) await storage.revokeRefreshTokenFamily(stored.familyId, context.now());
	return jsonResponse(200, {}, {'cache-control': 'no-store', pragma: 'no-cache'});
};
export default revokeHandler;
