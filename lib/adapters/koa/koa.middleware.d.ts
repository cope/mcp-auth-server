import type { Context, Next } from 'koa';
import type McpAuthType from '../../types/mcp.auth.type';
declare const koaMiddleware: (auth: McpAuthType<any>) => (ctx: Context, next: Next) => Promise<void>;
export default koaMiddleware;
