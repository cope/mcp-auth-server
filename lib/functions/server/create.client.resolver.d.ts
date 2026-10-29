import type McpAuthOptionsType from '../../types/mcp.auth.options.type';
import type ResolvedClientType from '../../types/resolved.client.type';
declare const createClientResolver: (options: McpAuthOptionsType<any>, now: () => Date, cimdEnabled: boolean) => ((clientId: string) => Promise<ResolvedClientType | {
    error: string;
}>);
export default createClientResolver;
