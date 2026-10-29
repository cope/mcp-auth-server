'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const to_node_http_request_1 = __importDefault(require("../node/to.node.http.request"));
const write_node_response_1 = __importDefault(require("../node/write.node.response"));
const expressMiddleware = (auth) => async (req, res, next) => {
    const originalUrl = req.originalUrl ?? req.url;
    const path = new URL(originalUrl, 'http://localhost').pathname;
    if (!auth.hasRoute({ method: req.method, path, query: {}, headers: {} }))
        return next();
    try {
        const preParsed = req.body && 'object' === typeof req.body && Object.keys(req.body).length > 0 ? req.body : undefined;
        const parsed = await (0, to_node_http_request_1.default)(Object.assign(req, { url: originalUrl }), preParsed);
        (0, write_node_response_1.default)(res, await auth.handle(parsed));
    }
    catch (error) {
        next(error);
    }
};
exports.default = expressMiddleware;
//# sourceMappingURL=express.middleware.js.map