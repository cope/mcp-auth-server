'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const trim_trailing_slashes_1 = __importDefault(require("../http/trim.trailing.slashes"));
const authorization_server_metadata_handler_1 = __importDefault(require("../../handlers/authorization.server.metadata.handler"));
const authorize_handler_1 = __importDefault(require("../../handlers/authorize.handler"));
const callback_handler_1 = __importDefault(require("../../handlers/callback.handler"));
const consent_decision_handler_1 = __importDefault(require("../../handlers/consent.decision.handler"));
const consent_page_handler_1 = __importDefault(require("../../handlers/consent.page.handler"));
const protected_resource_metadata_handler_1 = __importDefault(require("../../handlers/protected.resource.metadata.handler"));
const register_handler_1 = __importDefault(require("../../handlers/register.handler"));
const resume_handler_1 = __importDefault(require("../../handlers/resume.handler"));
const revoke_handler_1 = __importDefault(require("../../handlers/revoke.handler"));
const token_handler_1 = __importDefault(require("../../handlers/token.handler"));
const buildRoutes = (context) => {
    const { basePath, callbackPath } = context;
    const { upstream, resource } = context.options;
    const resourcePath = (0, trim_trailing_slashes_1.default)(new URL(resource).pathname);
    const withRequest = (handler) => (request) => handler(context, request);
    const metadata = (path, handler) => ({ method: 'GET', path, name: 'metadata', handler });
    const protectedResource = () => (0, protected_resource_metadata_handler_1.default)(context);
    const authorizationServer = () => (0, authorization_server_metadata_handler_1.default)(context);
    return [
        metadata('/.well-known/oauth-protected-resource', protectedResource),
        ...(resourcePath ? [metadata(`/.well-known/oauth-protected-resource${resourcePath}`, protectedResource)] : []),
        ...['/.well-known/oauth-authorization-server', '/.well-known/openid-configuration'].flatMap((path) => [...new Set([path, `${path}${basePath}`, `${basePath}${path}`])].map((full) => metadata(full, authorizationServer))),
        ...(context.registrationEnabled ? [{ method: 'POST', path: `${basePath}/register`, name: 'register', handler: withRequest(register_handler_1.default) }] : []),
        { method: 'GET', path: `${basePath}/authorize`, name: 'authorize', handler: withRequest(authorize_handler_1.default) },
        ...(upstream.callback ? [{ method: 'GET', path: `${basePath}${callbackPath}`, name: 'callback', handler: withRequest(callback_handler_1.default) }] : []),
        ...(upstream.resume ? [{ method: 'GET', path: `${basePath}/oauth/resume`, name: 'resume', handler: withRequest(resume_handler_1.default) }] : []),
        { method: 'GET', path: `${basePath}/oauth/consent`, name: 'consent', handler: withRequest(consent_page_handler_1.default) },
        { method: 'POST', path: `${basePath}/oauth/consent`, name: 'consent', handler: withRequest(consent_decision_handler_1.default) },
        { method: 'POST', path: `${basePath}/token`, name: 'token', handler: withRequest(token_handler_1.default) },
        { method: 'POST', path: `${basePath}/revoke`, name: 'revoke', handler: withRequest(revoke_handler_1.default) }
    ];
};
exports.default = buildRoutes;
//# sourceMappingURL=build.routes.js.map