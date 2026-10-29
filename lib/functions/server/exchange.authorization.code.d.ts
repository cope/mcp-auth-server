import type HttpResponseType from '../../types/http.response.type';
import type McpAuthContextType from '../../types/mcp.auth.context.type';
declare const exchangeAuthorizationCode: (context: McpAuthContextType<any>, params: Record<string, unknown>) => Promise<HttpResponseType>;
export default exchangeAuthorizationCode;
