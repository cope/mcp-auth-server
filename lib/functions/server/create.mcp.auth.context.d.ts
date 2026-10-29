import type McpAuthContextType from '../../types/mcp.auth.context.type';
import type McpAuthOptionsType from '../../types/mcp.auth.options.type';
declare const createMcpAuthContext: <TUser>(options: McpAuthOptionsType<TUser>) => McpAuthContextType<TUser>;
export default createMcpAuthContext;
