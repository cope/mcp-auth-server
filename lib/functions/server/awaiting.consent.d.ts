import type HttpRequestType from '../../types/http.request.type';
import type McpAuthContextType from '../../types/mcp.auth.context.type';
import type PendingAuthorizationType from '../../types/pending.authorization.type';
declare const awaitingConsent: (context: McpAuthContextType<any>, request: HttpRequestType, state: unknown) => Promise<PendingAuthorizationType | null>;
export default awaitingConsent;
