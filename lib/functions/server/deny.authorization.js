'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redirect_response_1 = __importDefault(require("../http/redirect.response"));
const build_error_redirect_1 = __importDefault(require("../redirect/build.error.redirect"));
const denyAuthorization = async (context, pending, description = 'sign-in failed') => {
    await context.options.storage.deletePendingAuthorization(pending.stateId);
    return (0, redirect_response_1.default)((0, build_error_redirect_1.default)(pending.redirectUri, context.issuer, 'access_denied', description, pending.clientState));
};
exports.default = denyAuthorization;
//# sourceMappingURL=deny.authorization.js.map