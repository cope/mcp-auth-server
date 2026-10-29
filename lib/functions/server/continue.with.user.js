'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const plain_error_response_1 = __importDefault(require("../http/plain.error.response"));
const redirect_response_1 = __importDefault(require("../http/redirect.response"));
const issue_authorization_code_1 = __importDefault(require("./issue.authorization.code"));
const continueWithUser = async (context, pending) => {
    const { storage } = context.options;
    if (!(await storage.hasConsent(pending.clientId, pending.userId))) {
        return (0, redirect_response_1.default)(`${context.issuer}/oauth/consent?state=${encodeURIComponent(pending.stateId)}`);
    }
    const taken = await storage.takePendingAuthorization(pending.stateId, { now: context.now(), hasUser: true });
    return taken ? (0, issue_authorization_code_1.default)(context, taken) : (0, plain_error_response_1.default)(400, 'Invalid or expired authorization request');
};
exports.default = continueWithUser;
//# sourceMappingURL=continue.with.user.js.map