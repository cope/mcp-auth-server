'use strict';

import jsonResponse from '../functions/http/json.response';
import type HttpResponseType from '../types/http.response.type';
import type McpAuthContextType from '../types/mcp.auth.context.type';

const authorizationServerMetadataHandler = async (context: McpAuthContextType<any>): Promise<HttpResponseType> => {
	const {issuer} = context;
	return jsonResponse(200, {
		issuer,
		authorization_endpoint: `${issuer}/authorize`,
		token_endpoint: `${issuer}/token`,
		...(context.registrationEnabled ? {registration_endpoint: `${issuer}/register`} : {}),
		revocation_endpoint: `${issuer}/revoke`,
		response_types_supported: ['code'],
		grant_types_supported: ['authorization_code', 'refresh_token'],
		code_challenge_methods_supported: ['S256'],
		token_endpoint_auth_methods_supported: ['none'],
		authorization_response_iss_parameter_supported: true,
		...(context.cimdEnabled ? {client_id_metadata_document_supported: true} : {})
	});
};
export default authorizationServerMetadataHandler;
