'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const is_metadata_client_id_1 = __importDefault(require("../functions/cimd/is.metadata.client.id"));
const plain_error_response_1 = __importDefault(require("../functions/http/plain.error.response"));
const query_param_1 = __importDefault(require("../functions/http/query.param"));
const describe_redirect_target_1 = __importDefault(require("../functions/redirect/describe.redirect.target"));
const is_loopback_redirect_1 = __importDefault(require("../functions/redirect/is.loopback.redirect"));
const awaiting_consent_1 = __importDefault(require("../functions/server/awaiting.consent"));
const consentPageHandler = async (context, request) => {
    const pending = await (0, awaiting_consent_1.default)(context, request, (0, query_param_1.default)(request, 'state'));
    if (!pending)
        return (0, plain_error_response_1.default)(400, 'Invalid or expired authorization request');
    const metadataDocument = (0, is_metadata_client_id_1.default)(pending.clientId);
    const model = {
        action: `${context.basePath}/oauth/consent`,
        state: pending.stateId,
        clientId: pending.clientId,
        clientName: pending.clientName,
        clientHost: metadataDocument ? new URL(pending.clientId).host : undefined,
        metadataDocument,
        redirectUri: pending.redirectUri,
        redirectTarget: (0, describe_redirect_target_1.default)(pending.redirectUri),
        redirectIsLocalhost: (0, is_loopback_redirect_1.default)(pending.redirectUri),
        userDisplayName: pending.userDisplayName,
        productName: context.productName,
        environmentLabel: context.options.environmentLabel
    };
    return {
        status: 200,
        headers: {
            'content-type': 'text/html; charset=utf-8',
            'x-frame-options': 'DENY',
            'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
            'cache-control': 'no-store'
        },
        body: context.renderConsent(model)
    };
};
exports.default = consentPageHandler;
//# sourceMappingURL=consent.page.handler.js.map