import type HttpResponseType from '../../types/http.response.type';
import type McpAuthContextType from '../../types/mcp.auth.context.type';
declare const issueTokens: (context: McpAuthContextType<any>, clientId: string, userId: string, familyId: string, expiresAt: Date, parentHash?: string) => Promise<HttpResponseType>;
export default issueTokens;
