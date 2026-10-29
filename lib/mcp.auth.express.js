'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expressMiddleware = void 0;
const express_middleware_1 = __importDefault(require("./adapters/express/express.middleware"));
exports.expressMiddleware = express_middleware_1.default;
const McpAuthExpress = {};
exports.default = McpAuthExpress;
//# sourceMappingURL=mcp.auth.express.js.map