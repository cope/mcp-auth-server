'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const trim_trailing_slashes_1 = __importDefault(require("../http/trim.trailing.slashes"));
const render_default_consent_1 = __importDefault(require("../consent/render.default.consent"));
const resolve_key_pair_1 = __importDefault(require("../keys/resolve.key.pair"));
const create_client_resolver_1 = __importDefault(require("./create.client.resolver"));
const createMcpAuthContext = (options) => {
    const issuer = (0, trim_trailing_slashes_1.default)(options.issuer);
    const now = options.now ?? (() => new Date());
    const cimdEnabled = options.cimd?.enabled ?? true;
    let keys;
    return {
        options,
        issuer,
        basePath: (0, trim_trailing_slashes_1.default)(new URL(issuer).pathname),
        callbackPath: options.callbackPath ?? '/oauth/callback',
        productName: options.productName ?? 'MCP server',
        redirectPolicy: { httpsHosts: options.redirects?.httpsHosts ?? [], customSchemes: options.redirects?.customSchemes ?? [] },
        ttl: {
            accessToken: options.ttl?.accessToken ?? 3600,
            refreshToken: options.ttl?.refreshToken ?? 2592000,
            pending: options.ttl?.pending ?? 600,
            code: options.ttl?.code ?? 60
        },
        now,
        registrationEnabled: options.registration?.enabled ?? true,
        cimdEnabled,
        renderConsent: options.renderConsent ?? render_default_consent_1.default,
        resourceMetadataUrl: `${issuer}/.well-known/oauth-protected-resource`,
        getKeys: () => (keys ??= (0, resolve_key_pair_1.default)(options.signingKey, options.verificationKey)),
        resolveClient: (0, create_client_resolver_1.default)(options, now, cimdEnabled)
    };
};
exports.default = createMcpAuthContext;
//# sourceMappingURL=create.mcp.auth.context.js.map