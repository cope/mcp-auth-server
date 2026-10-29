import type HttpRequestType from '../../types/http.request.type';
import type McpAuthContextType from '../../types/mcp.auth.context.type';
import type PendingAuthorizationType from '../../types/pending.authorization.type';
import type UpstreamContextType from '../../types/upstream.context.type';
declare const buildUpstreamContext: (context: McpAuthContextType<any>, request: HttpRequestType, pending: PendingAuthorizationType) => UpstreamContextType;
export default buildUpstreamContext;
