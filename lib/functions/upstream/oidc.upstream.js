'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sha256_base64_url_1 = __importDefault(require("../crypto/sha256.base64.url"));
const query_param_1 = __importDefault(require("../http/query.param"));
const verify_id_token_1 = __importDefault(require("./verify.id.token"));
const oidcUpstream = (options) => {
    const fetchImpl = options.fetch ?? ((input, init) => fetch(input, init));
    let discovery;
    let jwks;
    const loadDiscovery = () => {
        discovery ??= (async () => {
            const response = await fetchImpl(options.discoveryUrl);
            if (!response.ok)
                throw new Error(`OIDC discovery failed with status ${response.status}`);
            return (await response.json());
        })().catch((error) => {
            discovery = undefined;
            throw error;
        });
        return discovery;
    };
    const loadJwks = async (force) => {
        if (force)
            jwks = undefined;
        jwks ??= (async () => {
            const { jwks_uri } = await loadDiscovery();
            const response = await fetchImpl(jwks_uri);
            if (!response.ok)
                throw new Error(`OIDC jwks fetch failed with status ${response.status}`);
            return response.json();
        })().catch((error) => {
            jwks = undefined;
            throw error;
        });
        return jwks;
    };
    return {
        async begin(context) {
            const metadata = await loadDiscovery();
            const url = new URL(metadata.authorization_endpoint);
            url.search = new URLSearchParams({
                client_id: options.clientId,
                response_type: 'code',
                redirect_uri: context.callbackUrl,
                scope: options.scope ?? 'openid profile email',
                state: context.pending.stateId,
                code_challenge: await (0, sha256_base64_url_1.default)(context.pending.upstreamCodeVerifier ?? ''),
                code_challenge_method: 'S256'
            }).toString();
            return { type: 'redirect', url: url.toString() };
        },
        async callback(context) {
            const code = (0, query_param_1.default)(context.request, 'code');
            if ((0, query_param_1.default)(context.request, 'error') || !code)
                return null;
            const metadata = await loadDiscovery();
            const response = await fetchImpl(metadata.token_endpoint, {
                method: 'POST',
                headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: context.callbackUrl,
                    client_id: options.clientId,
                    client_secret: options.clientSecret,
                    code_verifier: context.pending.upstreamCodeVerifier ?? ''
                }).toString()
            });
            if (!response.ok)
                return null;
            const tokens = (await response.json());
            if (!tokens.id_token)
                return null;
            return (await (0, verify_id_token_1.default)(tokens.id_token, loadJwks, metadata.issuer, options.clientId, options.now?.()));
        }
    };
};
exports.default = oidcUpstream;
//# sourceMappingURL=oidc.upstream.js.map