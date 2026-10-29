'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const form_params_1 = __importDefault(require("../functions/http/form.params"));
const exchange_authorization_code_1 = __importDefault(require("../functions/server/exchange.authorization.code"));
const has_credentials_1 = __importDefault(require("../functions/server/has.credentials"));
const rotate_refresh_token_1 = __importDefault(require("../functions/server/rotate.refresh.token"));
const token_failure_1 = __importDefault(require("../functions/server/token.failure"));
const tokenHandler = async (context, request) => {
    const params = (0, form_params_1.default)(request.body);
    if ((0, has_credentials_1.default)(request, params))
        return (0, token_failure_1.default)('invalid_client', 'public clients must not send credentials', 401);
    if ('authorization_code' === params.grant_type)
        return (0, exchange_authorization_code_1.default)(context, params);
    if ('refresh_token' === params.grant_type)
        return (0, rotate_refresh_token_1.default)(context, params);
    return (0, token_failure_1.default)('unsupported_grant_type', 'grant_type must be authorization_code or refresh_token');
};
exports.default = tokenHandler;
//# sourceMappingURL=token.handler.js.map