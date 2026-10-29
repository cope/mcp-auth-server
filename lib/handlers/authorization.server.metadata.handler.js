'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const json_response_1 = __importDefault(require("../functions/http/json.response"));
const authorizationServerMetadataHandler = async (context) => {
    const { issuer } = context;
    return (0, json_response_1.default)(200, {
        issuer,
        authorization_endpoint: `${issuer}/authorize`,
        token_endpoint: `${issuer}/token`,
        ...(context.registrationEnabled ? { registration_endpoint: `${issuer}/register` } : {}),
        revocation_endpoint: `${issuer}/revoke`,
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        code_challenge_methods_supported: ['S256'],
        token_endpoint_auth_methods_supported: ['none'],
        authorization_response_iss_parameter_supported: true,
        ...(context.cimdEnabled ? { client_id_metadata_document_supported: true } : {})
    });
};
exports.default = authorizationServerMetadataHandler;
//# sourceMappingURL=authorization.server.metadata.handler.js.map