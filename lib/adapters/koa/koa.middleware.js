'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const to_node_http_request_1 = __importDefault(require("../node/to.node.http.request"));
const koaMiddleware = (auth) => async (ctx, next) => {
    if (!auth.hasRoute({ method: ctx.method, path: ctx.path, query: {}, headers: {} }))
        return next();
    const body = ctx.request.body;
    const preParsed = body && 'object' === typeof body && Object.keys(body).length > 0 ? body : undefined;
    const parsed = await (0, to_node_http_request_1.default)(ctx.req, preParsed);
    const response = await auth.handle({ ...parsed, path: ctx.path });
    ctx.status = response.status;
    ctx.set(response.headers);
    ctx.body = response.body ?? '';
};
exports.default = koaMiddleware;
//# sourceMappingURL=koa.middleware.js.map