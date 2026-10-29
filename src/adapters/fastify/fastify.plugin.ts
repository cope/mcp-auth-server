'use strict';

import type {FastifyInstance, FastifyReply, FastifyRequest} from 'fastify';

import parseBody from '../../functions/body/parse.body';
import parseQuery from '../../functions/body/parse.query';
import type McpAuthType from '../../types/mcp.auth.type';
import type RouteType from '../../types/route.type';

const fastifyPlugin =
	(auth: McpAuthType<any>) =>
	async (fastify: FastifyInstance): Promise<void> => {
		if (!fastify.hasContentTypeParser('application/x-www-form-urlencoded')) {
			fastify.addContentTypeParser('application/x-www-form-urlencoded', {parseAs: 'string'}, (_request, body, done): void =>
				done(null, parseBody('application/x-www-form-urlencoded', body as string))
			);
		}

		auth.routes.forEach((route: RouteType): void => {
			fastify.route({
				method: route.method,
				url: route.path,
				handler: async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
					const response = await auth.handle({
						method: request.method,
						path: route.path,
						query: parseQuery(new URL(request.url, 'http://localhost').searchParams),
						headers: request.headers,
						body: request.body,
						ip: request.ip
					});
					reply.headers(response.headers);
					return reply.status(response.status).send(response.body);
				}
			});
		});
	};
export default fastifyPlugin;
