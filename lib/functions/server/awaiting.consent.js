'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const text_value_1 = __importDefault(require("../http/text.value"));
const awaitingConsent = async (context, request, state) => {
    const stateId = (0, text_value_1.default)(state);
    const pending = stateId ? await context.options.storage.getPendingAuthorization(stateId, context.now()) : null;
    if (!pending?.userId)
        return null;
    const { upstream } = context.options;
    if (upstream.verifyUser && !(await upstream.verifyUser(request, pending.userId)))
        return null;
    return pending;
};
exports.default = awaitingConsent;
//# sourceMappingURL=awaiting.consent.js.map