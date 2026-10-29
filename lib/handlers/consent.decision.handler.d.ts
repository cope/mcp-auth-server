import type HttpRequestType from '../types/http.request.type';
import type HttpResponseType from '../types/http.response.type';
import type McpAuthContextType from '../types/mcp.auth.context.type';
declare const consentDecisionHandler: (context: McpAuthContextType<any>, request: HttpRequestType) => Promise<HttpResponseType>;
export default consentDecisionHandler;
