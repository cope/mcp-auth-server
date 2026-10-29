import type HttpResponseType from '../types/http.response.type';
import type McpAuthContextType from '../types/mcp.auth.context.type';
declare const protectedResourceMetadataHandler: (context: McpAuthContextType<any>) => Promise<HttpResponseType>;
export default protectedResourceMetadataHandler;
