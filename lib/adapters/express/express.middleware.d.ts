import type { RequestHandler } from 'express';
import type McpAuthType from '../../types/mcp.auth.type';
declare const expressMiddleware: (auth: McpAuthType<any>) => RequestHandler;
export default expressMiddleware;
