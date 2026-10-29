'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const parse_body_1 = __importDefault(require("../../functions/body/parse.body"));
const parse_query_1 = __importDefault(require("../../functions/body/parse.query"));
const fastifyPlugin = (auth) => async (fastify) => {
    if (!fastify.hasContentTypeParser('application/x-www-form-urlencoded')) {
        fastify.addContentTypeParser('application/x-www-form-urlencoded', { parseAs: 'string' }, (_request, body, done) => done(null, (0, parse_body_1.default)('application/x-www-form-urlencoded', body)));
    }
    auth.routes.forEach((route) => {
        fastify.route({
            method: route.method,
            url: route.path,
            handler: async (request, reply) => {
                const response = await auth.handle({
                    method: request.method,
                    path: route.path,
                    query: (0, parse_query_1.default)(new URL(request.url, 'http://localhost').searchParams),
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
exports.default = fastifyPlugin;
//# sourceMappingURL=fastify.plugin.js.map