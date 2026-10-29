import type HttpResponseType from '../../types/http.response.type';
import type McpAuthContextType from '../../types/mcp.auth.context.type';
declare const rotateRefreshToken: (context: McpAuthContextType<any>, params: Record<string, unknown>) => Promise<HttpResponseType>;
export default rotateRefreshToken;
