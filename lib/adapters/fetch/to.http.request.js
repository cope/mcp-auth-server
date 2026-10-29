'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const parse_body_1 = __importDefault(require("../../functions/body/parse.body"));
const parse_query_1 = __importDefault(require("../../functions/body/parse.query"));
const toHttpRequest = async (request) => {
    const url = new URL(request.url);
    const headers = Object.fromEntries(request.headers.entries());
    const raw = 'GET' === request.method || 'HEAD' === request.method ? '' : await request.text();
    return {
        method: request.method,
        path: url.pathname,
        query: (0, parse_query_1.default)(url.searchParams),
        headers,
        body: (0, parse_body_1.default)(headers['content-type'], raw),
        ip: headers['cf-connecting-ip'] ?? headers['x-real-ip'] ?? headers['x-forwarded-for']?.split(',')[0]?.trim()
    };
};
exports.default = toHttpRequest;
//# sourceMappingURL=to.http.request.js.map