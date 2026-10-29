'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const to_node_http_request_1 = __importDefault(require("./to.node.http.request"));
const write_node_response_1 = __importDefault(require("./write.node.response"));
const createNodeHandler = (auth) => async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (!auth.hasRoute({ method: req.method ?? 'GET', path: url.pathname, query: {}, headers: {} }))
        return false;
    (0, write_node_response_1.default)(res, await auth.handle(await (0, to_node_http_request_1.default)(req)));
    return true;
};
exports.default = createNodeHandler;
//# sourceMappingURL=create.node.handler.js.map