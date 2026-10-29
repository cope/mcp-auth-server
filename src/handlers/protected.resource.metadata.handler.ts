'use strict';

import jsonResponse from '../functions/http/json.response';
import type HttpResponseType from '../types/http.response.type';
import type McpAuthContextType from '../types/mcp.auth.context.type';

const protectedResourceMetadataHandler = async (context: McpAuthContextType<any>): Promise<HttpResponseType> =>
	jsonResponse(200, {resource: context.options.resource, authorization_servers: [context.issuer], bearer_methods_supported: ['header']});
export default protectedResourceMetadataHandler;
