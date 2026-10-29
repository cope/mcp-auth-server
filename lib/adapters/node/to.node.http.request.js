'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const parse_query_1 = __importDefault(require("../../functions/body/parse.query"));
const parse_node_body_1 = __importDefault(require("./parse.node.body"));
const toNodeHttpRequest = async (req, preParsedBody) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    return {
        method: req.method ?? 'GET',
        path: url.pathname,
        query: (0, parse_query_1.default)(url.searchParams),
        headers: { ...req.headers },
        body: await (0, parse_node_body_1.default)(req, preParsedBody),
        ip: req.socket?.remoteAddress
    };
};
exports.default = toNodeHttpRequest;
//# sourceMappingURL=to.node.http.request.js.map