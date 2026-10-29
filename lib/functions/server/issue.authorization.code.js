'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const random_token_1 = __importDefault(require("../crypto/random.token"));
const sha256_hex_1 = __importDefault(require("../crypto/sha256.hex"));
const build_redirect_1 = __importDefault(require("../redirect/build.redirect"));
const redirect_response_1 = __importDefault(require("../http/redirect.response"));
const issueAuthorizationCode = async (context, pending) => {
    const code = (0, random_token_1.default)(32);
    await context.options.storage.saveAuthorizationCode({
        codeHash: await (0, sha256_hex_1.default)(code),
        clientId: pending.clientId,
        redirectUri: pending.redirectUri,
        codeChallenge: pending.codeChallenge,
        resource: pending.resource,
        userId: pending.userId,
        expiresAt: new Date(context.now().getTime() + context.ttl.code * 1000)
    });
    return (0, redirect_response_1.default)((0, build_redirect_1.default)(pending.redirectUri, context.issuer, { code, state: pending.clientState }));
};
exports.default = issueAuthorizationCode;
//# sourceMappingURL=issue.authorization.code.js.map