'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const json_response_1 = __importDefault(require("../http/json.response"));
const oauth_error_response_1 = __importDefault(require("../http/oauth.error.response"));
const find_route_1 = __importDefault(require("./find.route"));
const limited = ['register', 'token', 'revoke'];
const handleRequest = async (context, routes, request) => {
    const route = (0, find_route_1.default)(routes, request);
    if (!route)
        return (0, json_response_1.default)(404, { error: 'not_found' });
    const { rateLimit } = context.options;
    if (rateLimit && limited.includes(route.name) && !(await rateLimit(request.ip ?? 'unknown', route.name))) {
        return (0, oauth_error_response_1.default)(429, 'rate_limited', 'too many requests', { 'retry-after': '60' });
    }
    return route.handler(request);
};
exports.default = handleRequest;
//# sourceMappingURL=handle.request.js.map