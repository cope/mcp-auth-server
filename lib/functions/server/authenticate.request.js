'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const header_value_1 = __importDefault(require("../http/header.value"));
const text_value_1 = __importDefault(require("../http/text.value"));
const verify_access_token_1 = __importDefault(require("../jwt/verify.access.token"));
const challenge_response_1 = __importDefault(require("./challenge.response"));
const authenticateRequest = async (context, headers, rpcBody) => {
    const bearer = /^Bearer (\S+)$/i.exec((0, header_value_1.default)(headers, 'authorization') ?? '')?.[1];
    if (!bearer)
        return (0, challenge_response_1.default)(context, rpcBody, false, 'missing_token');
    const verified = await (0, verify_access_token_1.default)(await context.getKeys(), bearer, context.issuer, context.options.resource, context.now());
    if ('reason' in verified)
        return (0, challenge_response_1.default)(context, rpcBody, true, verified.reason);
    const subject = (0, text_value_1.default)(verified.claims.sub);
    const user = subject ? await context.options.loadActiveUser(subject) : null;
    if (!user)
        return (0, challenge_response_1.default)(context, rpcBody, true, 'user_inactive');
    return { user, claims: verified.claims };
};
exports.default = authenticateRequest;
//# sourceMappingURL=authenticate.request.js.map