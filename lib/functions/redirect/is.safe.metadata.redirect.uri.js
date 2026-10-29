'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const parse_url_1 = __importDefault(require("./parse.url"));
const loopbackHosts = ['localhost', '127.0.0.1'];
const dangerousSchemes = ['javascript:', 'data:', 'file:', 'vbscript:', 'blob:', 'about:'];
const isSafeMetadataRedirectUri = (redirectUri) => {
    const url = (0, parse_url_1.default)(redirectUri);
    if (!url || 'string' !== typeof redirectUri || redirectUri.includes('#'))
        return false;
    if ('http:' === url.protocol)
        return loopbackHosts.includes(url.hostname);
    if ('https:' === url.protocol)
        return true;
    return !dangerousSchemes.includes(url.protocol);
};
exports.default = isSafeMetadataRedirectUri;
//# sourceMappingURL=is.safe.metadata.redirect.uri.js.map