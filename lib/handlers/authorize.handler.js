'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const random_token_1 = __importDefault(require("../functions/crypto/random.token"));
const oauth_error_response_1 = __importDefault(require("../functions/http/oauth.error.response"));
const query_param_1 = __importDefault(require("../functions/http/query.param"));
const redirect_response_1 = __importDefault(require("../functions/http/redirect.response"));
const build_error_redirect_1 = __importDefault(require("../functions/redirect/build.error.redirect"));
const attach_and_continue_1 = __importDefault(require("../functions/server/attach.and.continue"));
const build_upstream_context_1 = __importDefault(require("../functions/server/build.upstream.context"));
const deny_authorization_1 = __importDefault(require("../functions/server/deny.authorization"));
const codeChallengePattern = /^[A-Za-z0-9_-]{43}$/;
const authorizeHandler = async (context, request) => {
    const { storage, upstream, resource, logger } = context.options;
    const clientId = (0, query_param_1.default)(request, 'client_id');
    const client = clientId ? await context.resolveClient(clientId) : { error: 'unknown client_id' };
    if ('error' in client)
        return (0, oauth_error_response_1.default)(400, 'invalid_request', client.error);
    const redirectUri = (0, query_param_1.default)(request, 'redirect_uri');
    if (!redirectUri || !client.redirectUris.includes(redirectUri))
        return (0, oauth_error_response_1.default)(400, 'invalid_request', 'redirect_uri is not registered for this client');
    const clientState = (0, query_param_1.default)(request, 'state');
    const fail = (error, description) => (0, redirect_response_1.default)((0, build_error_redirect_1.default)(redirectUri, context.issuer, error, description, clientState));
    if ('code' !== (0, query_param_1.default)(request, 'response_type'))
        return fail('unsupported_response_type', 'response_type must be code');
    const codeChallenge = (0, query_param_1.default)(request, 'code_challenge');
    if (!codeChallenge || !codeChallengePattern.test(codeChallenge) || 'S256' !== (0, query_param_1.default)(request, 'code_challenge_method')) {
        return fail('invalid_request', 'PKCE with code_challenge_method S256 is required');
    }
    if ((0, query_param_1.default)(request, 'resource') !== resource)
        return fail('invalid_target', 'resource does not match this server');
    const pending = {
        stateId: (0, random_token_1.default)(32),
        clientId: client.clientId,
        clientName: client.clientName,
        redirectUri,
        codeChallenge,
        resource,
        clientState,
        upstreamCodeVerifier: (0, random_token_1.default)(32),
        expiresAt: new Date(context.now().getTime() + context.ttl.pending * 1000)
    };
    await storage.savePendingAuthorization(pending);
    try {
        const begun = await upstream.begin((0, build_upstream_context_1.default)(context, request, pending));
        if ('redirect' === begun.type)
            return (0, redirect_response_1.default)(begun.url);
        return await (0, attach_and_continue_1.default)(context, pending, begun.user);
    }
    catch (error) {
        logger?.error?.('MCP upstream begin failed', { error: error instanceof Error ? error.message : String(error) });
        return (0, deny_authorization_1.default)(context, pending);
    }
};
exports.default = authorizeHandler;
//# sourceMappingURL=authorize.handler.js.map