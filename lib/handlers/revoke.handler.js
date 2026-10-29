'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sha256_hex_1 = __importDefault(require("../functions/crypto/sha256.hex"));
const form_params_1 = __importDefault(require("../functions/http/form.params"));
const json_response_1 = __importDefault(require("../functions/http/json.response"));
const text_value_1 = __importDefault(require("../functions/http/text.value"));
const has_credentials_1 = __importDefault(require("../functions/server/has.credentials"));
const token_failure_1 = __importDefault(require("../functions/server/token.failure"));
const revokeHandler = async (context, request) => {
    const params = (0, form_params_1.default)(request.body);
    if ((0, has_credentials_1.default)(request, params))
        return (0, token_failure_1.default)('invalid_client', 'public clients must not send credentials', 401);
    const value = (0, text_value_1.default)(params.token);
    const clientId = (0, text_value_1.default)(params.client_id);
    if (!value || !clientId)
        return (0, token_failure_1.default)('invalid_request', 'token and client_id are required');
    const { storage } = context.options;
    const stored = await storage.findRefreshToken(await (0, sha256_hex_1.default)(value));
    if (stored && stored.clientId === clientId)
        await storage.revokeRefreshTokenFamily(stored.familyId, context.now());
    return (0, json_response_1.default)(200, {}, { 'cache-control': 'no-store', pragma: 'no-cache' });
};
exports.default = revokeHandler;
//# sourceMappingURL=revoke.handler.js.map