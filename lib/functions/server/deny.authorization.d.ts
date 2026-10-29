import type HttpResponseType from '../../types/http.response.type';
import type McpAuthContextType from '../../types/mcp.auth.context.type';
import type PendingAuthorizationType from '../../types/pending.authorization.type';
declare const denyAuthorization: (context: McpAuthContextType<any>, pending: PendingAuthorizationType, description?: string) => Promise<HttpResponseType>;
export default denyAuthorization;
