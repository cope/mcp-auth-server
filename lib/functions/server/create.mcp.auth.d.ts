import type McpAuthOptionsType from '../../types/mcp.auth.options.type';
import type McpAuthType from '../../types/mcp.auth.type';
declare const createMcpAuth: <TUser = unknown>(options: McpAuthOptionsType<TUser>) => McpAuthType<TUser>;
export default createMcpAuth;
