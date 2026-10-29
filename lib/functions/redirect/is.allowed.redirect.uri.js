'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const parse_url_1 = __importDefault(require("./parse.url"));
const loopbackHosts = ['localhost', '127.0.0.1'];
const isAllowedRedirectUri = (redirectUri, policy) => {
    const url = (0, parse_url_1.default)(redirectUri);
    if (!url || url.hash || 'string' !== typeof redirectUri || redirectUri.includes('#'))
        return false;
    if ('http:' === url.protocol)
        return loopbackHosts.includes(url.hostname);
    if ('https:' === url.protocol)
        return policy.httpsHosts.includes(url.hostname);
    return policy.customSchemes.some((scheme) => redirectUri.startsWith(scheme));
};
exports.default = isAllowedRedirectUri;
//# sourceMappingURL=is.allowed.redirect.uri.js.map