import type AuthenticateResultType from '../../types/authenticate.result.type';
import type HttpRequestType from '../../types/http.request.type';
import type McpAuthContextType from '../../types/mcp.auth.context.type';
declare const authenticateRequest: <TUser>(context: McpAuthContextType<TUser>, headers: HttpRequestType["headers"], rpcBody?: unknown) => Promise<AuthenticateResultType<TUser>>;
export default authenticateRequest;
