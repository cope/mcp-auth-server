'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const random_token_1 = __importDefault(require("../crypto/random.token"));
const sha256_hex_1 = __importDefault(require("../crypto/sha256.hex"));
const json_response_1 = __importDefault(require("../http/json.response"));
const sign_access_token_1 = __importDefault(require("../jwt/sign.access.token"));
const token_failure_1 = __importDefault(require("./token.failure"));
const issueTokens = async (context, clientId, userId, familyId, expiresAt, parentHash) => {
    const { storage, resource } = context.options;
    const refreshToken = (0, random_token_1.default)(32);
    await storage.saveRefreshToken({ tokenHash: await (0, sha256_hex_1.default)(refreshToken), familyId, clientId, userId, resource, expiresAt });
    if (parentHash && (await storage.findRefreshToken(parentHash))?.revokedAt) {
        await storage.revokeRefreshTokenFamily(familyId, context.now());
        return (0, token_failure_1.default)('invalid_grant', 'refresh token was revoked during rotation');
    }
    const accessToken = await (0, sign_access_token_1.default)(await context.getKeys(), {
        issuer: context.issuer,
        resource,
        userId,
        clientId,
        ttlSeconds: context.ttl.accessToken,
        now: context.now()
    });
    return (0, json_response_1.default)(200, { access_token: accessToken, token_type: 'Bearer', expires_in: context.ttl.accessToken, refresh_token: refreshToken }, { 'cache-control': 'no-store', pragma: 'no-cache' });
};
exports.default = issueTokens;
//# sourceMappingURL=issue.tokens.js.map