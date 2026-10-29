'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sha256_hex_1 = __importDefault(require("../crypto/sha256.hex"));
const text_value_1 = __importDefault(require("../http/text.value"));
const issue_tokens_1 = __importDefault(require("./issue.tokens"));
const token_failure_1 = __importDefault(require("./token.failure"));
const rotateRefreshToken = async (context, params) => {
    const refreshToken = (0, text_value_1.default)(params.refresh_token);
    const clientId = (0, text_value_1.default)(params.client_id);
    if (!refreshToken || !clientId)
        return (0, token_failure_1.default)('invalid_request', 'refresh_token and client_id are required');
    const { storage } = context.options;
    const tokenHash = await (0, sha256_hex_1.default)(refreshToken);
    const stored = await storage.findRefreshToken(tokenHash);
    const at = context.now();
    if (!stored || stored.clientId !== clientId || stored.expiresAt <= at)
        return (0, token_failure_1.default)('invalid_grant', 'refresh token is invalid, expired or revoked');
    if (stored.revokedAt) {
        await storage.revokeRefreshTokenFamily(stored.familyId, at);
        return (0, token_failure_1.default)('invalid_grant', 'refresh token is invalid, expired or revoked');
    }
    const claimed = await storage.claimRefreshToken(tokenHash, at);
    if (!claimed) {
        await storage.revokeRefreshTokenFamily(stored.familyId, at);
        return (0, token_failure_1.default)('invalid_grant', 'refresh token was already used; all tokens of this session are revoked');
    }
    return (0, issue_tokens_1.default)(context, clientId, stored.userId, stored.familyId, stored.expiresAt, tokenHash);
};
exports.default = rotateRefreshToken;
//# sourceMappingURL=rotate.refresh.token.js.map