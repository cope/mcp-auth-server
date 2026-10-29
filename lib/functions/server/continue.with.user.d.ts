import type HttpResponseType from '../../types/http.response.type';
import type McpAuthContextType from '../../types/mcp.auth.context.type';
import type PendingAuthorizationType from '../../types/pending.authorization.type';
declare const continueWithUser: (context: McpAuthContextType<any>, pending: PendingAuthorizationType) => Promise<HttpResponseType>;
export default continueWithUser;
