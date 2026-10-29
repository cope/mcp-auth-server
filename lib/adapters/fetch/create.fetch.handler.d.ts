import type McpAuthType from '../../types/mcp.auth.type';
declare const createFetchHandler: (auth: McpAuthType<any>) => (request: Request) => Promise<Response | null>;
export default createFetchHandler;
