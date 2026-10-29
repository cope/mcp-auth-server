'use strict';

import formParams from '../functions/http/form.params';
import exchangeAuthorizationCode from '../functions/server/exchange.authorization.code';
import hasCredentials from '../functions/server/has.credentials';
import rotateRefreshToken from '../functions/server/rotate.refresh.token';
import tokenFailure from '../functions/server/token.failure';
import type HttpRequestType from '../types/http.request.type';
import type HttpResponseType from '../types/http.response.type';
import type McpAuthContextType from '../types/mcp.auth.context.type';

const tokenHandler = async (context: McpAuthContextType<any>, request: HttpRequestType): Promise<HttpResponseType> => {
	const params: Record<string, unknown> = formParams(request.body);
	if (hasCredentials(request, params)) return tokenFailure('invalid_client', 'public clients must not send credentials', 401);
	if ('authorization_code' === params.grant_type) return exchangeAuthorizationCode(context, params);
	if ('refresh_token' === params.grant_type) return rotateRefreshToken(context, params);
	return tokenFailure('unsupported_grant_type', 'grant_type must be authorization_code or refresh_token');
};
export default tokenHandler;
