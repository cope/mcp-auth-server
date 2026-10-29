'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fastifyPlugin = void 0;
const fastify_plugin_1 = __importDefault(require("./adapters/fastify/fastify.plugin"));
exports.fastifyPlugin = fastify_plugin_1.default;
const McpAuthFastify = {};
exports.default = McpAuthFastify;
//# sourceMappingURL=mcp.auth.fastify.js.map