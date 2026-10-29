import type AuthenticatedUserType from '../../types/authenticated.user.type';
import type HttpResponseType from '../../types/http.response.type';
import type McpAuthContextType from '../../types/mcp.auth.context.type';
import type PendingAuthorizationType from '../../types/pending.authorization.type';
declare const attachAndContinue: (context: McpAuthContextType<any>, pending: PendingAuthorizationType, user: AuthenticatedUserType) => Promise<HttpResponseType>;
export default attachAndContinue;
