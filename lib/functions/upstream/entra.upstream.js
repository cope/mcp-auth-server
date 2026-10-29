'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const oidc_upstream_1 = __importDefault(require("./oidc.upstream"));
const entraUpstream = (options) => (0, oidc_upstream_1.default)({
    discoveryUrl: `https://login.microsoftonline.com/${encodeURIComponent(options.tenantId)}/v2.0/.well-known/openid-configuration`,
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    scope: options.scope ?? 'openid profile email',
    fetch: options.fetch,
    now: options.now
});
exports.default = entraUpstream;
//# sourceMappingURL=entra.upstream.js.map