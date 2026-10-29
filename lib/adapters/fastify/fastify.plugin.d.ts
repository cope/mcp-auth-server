import type { FastifyInstance } from 'fastify';
import type McpAuthType from '../../types/mcp.auth.type';
declare const fastifyPlugin: (auth: McpAuthType<any>) => (fastify: FastifyInstance) => Promise<void>;
export default fastifyPlugin;
