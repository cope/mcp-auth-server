'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const is_safe_metadata_redirect_uri_1 = __importDefault(require("../redirect/is.safe.metadata.redirect.uri"));
const validateMetadataDocument = (document, url) => {
    if (!document || 'object' !== typeof document || Array.isArray(document))
        throw new Error('client metadata document must be a JSON object');
    const metadata = document;
    if (metadata.client_id !== url)
        throw new Error('client_id in the metadata document does not match its URL');
    if ('string' !== typeof metadata.client_name || !metadata.client_name.trim())
        throw new Error('client metadata document requires client_name');
    const uris = metadata.redirect_uris;
    if (!Array.isArray(uris) || 0 === uris.length || !uris.every(is_safe_metadata_redirect_uri_1.default))
        throw new Error('client metadata document requires valid redirect_uris');
    if (undefined !== metadata.client_secret || undefined !== metadata.client_secret_expires_at)
        throw new Error('client metadata document must not contain client secrets');
    if (undefined !== metadata.token_endpoint_auth_method && 'none' !== metadata.token_endpoint_auth_method)
        throw new Error('only token_endpoint_auth_method none is supported');
    return metadata;
};
exports.default = validateMetadataDocument;
//# sourceMappingURL=validate.metadata.document.js.map