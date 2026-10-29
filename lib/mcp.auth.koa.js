'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.koaMiddleware = void 0;
const koa_middleware_1 = __importDefault(require("./adapters/koa/koa.middleware"));
exports.koaMiddleware = koa_middleware_1.default;
const McpAuthKoa = {};
exports.default = McpAuthKoa;
//# sourceMappingURL=mcp.auth.koa.js.map