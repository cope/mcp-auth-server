import type { IncomingMessage, ServerResponse } from 'node:http';
import type McpAuthType from '../../types/mcp.auth.type';
declare const createNodeHandler: (auth: McpAuthType<any>) => (req: IncomingMessage, res: ServerResponse) => Promise<boolean>;
export default createNodeHandler;
