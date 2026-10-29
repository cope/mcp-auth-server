'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const form_params_1 = __importDefault(require("../functions/http/form.params"));
const json_response_1 = __importDefault(require("../functions/http/json.response"));
const oauth_error_response_1 = __importDefault(require("../functions/http/oauth.error.response"));
const random_id_1 = __importDefault(require("../functions/crypto/random.id"));
const is_allowed_redirect_uri_1 = __importDefault(require("../functions/redirect/is.allowed.redirect.uri"));
const registerHandler = async (context, request) => {
    const body = (0, form_params_1.default)(request.body);
    const redirectUris = body.redirect_uris;
    if (!Array.isArray(redirectUris) || 0 === redirectUris.length)
        return (0, oauth_error_response_1.default)(400, 'invalid_redirect_uri', 'redirect_uris must be a non-empty array');
    const rejected = redirectUris.find((uri) => !(0, is_allowed_redirect_uri_1.default)(uri, context.redirectPolicy));
    if (undefined !== rejected) {
        context.options.logger?.info?.('MCP register rejected', { redirectUris, clientName: body.client_name });
        return (0, oauth_error_response_1.default)(400, 'invalid_redirect_uri', `redirect_uri not allowed: ${String(rejected).slice(0, 200)}`);
    }
    const client = {
        clientId: (0, random_id_1.default)(),
        clientName: 'string' === typeof body.client_name ? body.client_name.slice(0, 200) : undefined,
        redirectUris: redirectUris,
        applicationType: 'string' === typeof body.application_type ? body.application_type.slice(0, 32) : undefined,
        tokenEndpointAuthMethod: 'none',
        grantTypes: ['authorization_code', 'refresh_token'],
        responseTypes: ['code'],
        createdAt: context.now()
    };
    await context.options.storage.saveClient(client);
    return (0, json_response_1.default)(201, {
        client_id: client.clientId,
        client_id_issued_at: Math.floor(client.createdAt.getTime() / 1000),
        client_name: client.clientName,
        redirect_uris: client.redirectUris,
        ...(client.applicationType ? { application_type: client.applicationType } : {}),
        token_endpoint_auth_method: client.tokenEndpointAuthMethod,
        grant_types: client.grantTypes,
        response_types: client.responseTypes
    }, { 'cache-control': 'no-store' });
};
exports.default = registerHandler;
//# sourceMappingURL=register.handler.js.map