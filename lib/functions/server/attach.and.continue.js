'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const oauth_error_response_1 = __importDefault(require("../http/oauth.error.response"));
const continue_with_user_1 = __importDefault(require("./continue.with.user"));
const attachAndContinue = async (context, pending, user) => {
    const attached = await context.options.storage.attachUserToPendingAuthorization(pending.stateId, user.id, context.now(), user.displayName);
    if (!attached)
        return (0, oauth_error_response_1.default)(400, 'invalid_request', 'unknown or already used state');
    return (0, continue_with_user_1.default)(context, attached);
};
exports.default = attachAndContinue;
//# sourceMappingURL=attach.and.continue.js.map