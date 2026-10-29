import type AuthenticateResultType from '../../types/authenticate.result.type';
import type McpAuthContextType from '../../types/mcp.auth.context.type';
declare const challengeResponse: (context: McpAuthContextType<any>, rpcBody: unknown, tokenSent: boolean, reason: string) => AuthenticateResultType<any>;
export default challengeResponse;
