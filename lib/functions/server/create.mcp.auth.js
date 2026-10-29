'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authenticate_request_1 = __importDefault(require("./authenticate.request"));
const build_routes_1 = __importDefault(require("./build.routes"));
const create_mcp_auth_context_1 = __importDefault(require("./create.mcp.auth.context"));
const find_route_1 = __importDefault(require("./find.route"));
const handle_request_1 = __importDefault(require("./handle.request"));
const createMcpAuth = (options) => {
    const context = (0, create_mcp_auth_context_1.default)(options);
    const routes = (0, build_routes_1.default)(context);
    return {
        issuer: context.issuer,
        resource: options.resource,
        routes,
        hasRoute: (request) => !!(0, find_route_1.default)(routes, request),
        handle: (request) => (0, handle_request_1.default)(context, routes, request),
        authenticate: (headers, rpcBody) => (0, authenticate_request_1.default)(context, headers, rpcBody),
        deleteExpired: () => options.storage.deleteExpired(context.now())
    };
};
exports.default = createMcpAuth;
//# sourceMappingURL=create.mcp.auth.js.map