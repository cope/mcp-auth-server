'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const to_http_request_1 = __importDefault(require("./to.http.request"));
const to_response_1 = __importDefault(require("./to.response"));
const createFetchHandler = (auth) => async (request) => {
    const parsed = await (0, to_http_request_1.default)(request);
    return auth.hasRoute(parsed) ? (0, to_response_1.default)(await auth.handle(parsed)) : null;
};
exports.default = createFetchHandler;
//# sourceMappingURL=create.fetch.handler.js.map