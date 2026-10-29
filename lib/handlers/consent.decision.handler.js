'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const form_params_1 = __importDefault(require("../functions/http/form.params"));
const plain_error_response_1 = __importDefault(require("../functions/http/plain.error.response"));
const redirect_response_1 = __importDefault(require("../functions/http/redirect.response"));
const build_error_redirect_1 = __importDefault(require("../functions/redirect/build.error.redirect"));
const awaiting_consent_1 = __importDefault(require("../functions/server/awaiting.consent"));
const issue_authorization_code_1 = __importDefault(require("../functions/server/issue.authorization.code"));
const consentDecisionHandler = async (context, request) => {
    const invalid = () => (0, plain_error_response_1.default)(400, 'Invalid or expired authorization request');
    const body = (0, form_params_1.default)(request.body);
    const decision = body.decision;
    if ('approve' !== decision && 'deny' !== decision)
        return invalid();
    if (!(await (0, awaiting_consent_1.default)(context, request, body.state)))
        return invalid();
    const { storage } = context.options;
    const pending = await storage.takePendingAuthorization(body.state, { now: context.now(), hasUser: true });
    if (!pending)
        return invalid();
    if ('deny' === decision)
        return (0, redirect_response_1.default)((0, build_error_redirect_1.default)(pending.redirectUri, context.issuer, 'access_denied', 'the user denied the request', pending.clientState));
    await storage.upsertConsent({ clientId: pending.clientId, userId: pending.userId });
    return (0, issue_authorization_code_1.default)(context, pending);
};
exports.default = consentDecisionHandler;
//# sourceMappingURL=consent.decision.handler.js.map