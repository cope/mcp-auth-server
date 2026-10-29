import type HttpRequestType from '../../types/http.request.type';
import type HttpResponseType from '../../types/http.response.type';
import type McpAuthContextType from '../../types/mcp.auth.context.type';
import type RouteType from '../../types/route.type';
declare const handleRequest: (context: McpAuthContextType<any>, routes: RouteType[], request: HttpRequestType) => Promise<HttpResponseType>;
export default handleRequest;
