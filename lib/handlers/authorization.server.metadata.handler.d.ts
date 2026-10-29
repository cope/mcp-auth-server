import type HttpResponseType from '../types/http.response.type';
import type McpAuthContextType from '../types/mcp.auth.context.type';
declare const authorizationServerMetadataHandler: (context: McpAuthContextType<any>) => Promise<HttpResponseType>;
export default authorizationServerMetadataHandler;
