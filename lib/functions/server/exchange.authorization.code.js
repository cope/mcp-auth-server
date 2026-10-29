'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const random_id_1 = __importDefault(require("../crypto/random.id"));
const sha256_base64_url_1 = __importDefault(require("../crypto/sha256.base64.url"));
const sha256_hex_1 = __importDefault(require("../crypto/sha256.hex"));
const text_value_1 = __importDefault(require("../http/text.value"));
const issue_tokens_1 = __importDefault(require("./issue.tokens"));
const token_failure_1 = __importDefault(require("./token.failure"));
const codeVerifierPattern = /^[A-Za-z0-9\-._~]{43,128}$/;
const exchangeAuthorizationCode = async (context, params) => {
    const [code, clientId, redirectUri, codeVerifier, resource] = ['code', 'client_id', 'redirect_uri', 'code_verifier', 'resource'].map((name) => (0, text_value_1.default)(params[name]));
    if (!code || !clientId || !redirectUri || !codeVerifier)
        return (0, token_failure_1.default)('invalid_request', 'code, client_id, redirect_uri and code_verifier are required');
    if (!codeVerifierPattern.test(codeVerifier))
        return (0, token_failure_1.default)('invalid_grant', 'code_verifier is malformed');
    const claimedAt = context.now();
    const stored = await context.options.storage.claimAuthorizationCode(await (0, sha256_hex_1.default)(code), claimedAt);
    if (!stored)
        return (0, token_failure_1.default)('invalid_grant', 'authorization code is invalid, expired or already used');
    if (stored.clientId !== clientId ||
        stored.redirectUri !== redirectUri ||
        stored.codeChallenge !== (await (0, sha256_base64_url_1.default)(codeVerifier)) ||
        (resource && stored.resource !== resource)) {
        return (0, token_failure_1.default)('invalid_grant', 'authorization code does not match the request');
    }
    return (0, issue_tokens_1.default)(context, clientId, stored.userId, (0, random_id_1.default)(), new Date(claimedAt.getTime() + context.ttl.refreshToken * 1000));
};
exports.default = exchangeAuthorizationCode;
//# sourceMappingURL=exchange.authorization.code.js.map