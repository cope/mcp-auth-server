'use strict';

import formParams from '../functions/http/form.params';
import jsonResponse from '../functions/http/json.response';
import oauthErrorResponse from '../functions/http/oauth.error.response';
import randomId from '../functions/crypto/random.id';
import isAllowedRedirectUri from '../functions/redirect/is.allowed.redirect.uri';
import type ClientRecordType from '../types/client.record.type';
import type HttpRequestType from '../types/http.request.type';
import type HttpResponseType from '../types/http.response.type';
import type McpAuthContextType from '../types/mcp.auth.context.type';

const registerHandler = async (context: McpAuthContextType<any>, request: HttpRequestType): Promise<HttpResponseType> => {
	const body: Record<string, unknown> = formParams(request.body);
	const redirectUris: unknown = body.redirect_uris;
	if (!Array.isArray(redirectUris) || 0 === redirectUris.length) return oauthErrorResponse(400, 'invalid_redirect_uri', 'redirect_uris must be a non-empty array');
	const rejected: unknown = redirectUris.find((uri: unknown): boolean => !isAllowedRedirectUri(uri, context.redirectPolicy));
	if (undefined !== rejected) {
		context.options.logger?.info?.('MCP register rejected', {redirectUris, clientName: body.client_name});
		return oauthErrorResponse(400, 'invalid_redirect_uri', `redirect_uri not allowed: ${String(rejected).slice(0, 200)}`);
	}

	const client: ClientRecordType = {
		clientId: randomId(),
		clientName: 'string' === typeof body.client_name ? body.client_name.slice(0, 200) : undefined,
		redirectUris: redirectUris as string[],
		applicationType: 'string' === typeof body.application_type ? body.application_type.slice(0, 32) : undefined,
		tokenEndpointAuthMethod: 'none',
		grantTypes: ['authorization_code', 'refresh_token'],
		responseTypes: ['code'],
		createdAt: context.now()
	};
	await context.options.storage.saveClient(client);

	return jsonResponse(
		201,
		{
			client_id: client.clientId,
			client_id_issued_at: Math.floor(client.createdAt.getTime() / 1000),
			client_name: client.clientName,
			redirect_uris: client.redirectUris,
			...(client.applicationType ? {application_type: client.applicationType} : {}),
			token_endpoint_auth_method: client.tokenEndpointAuthMethod,
			grant_types: client.grantTypes,
			response_types: client.responseTypes
		},
		{'cache-control': 'no-store'}
	);
};
export default registerHandler;
