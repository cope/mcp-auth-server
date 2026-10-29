'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const oauth_error_response_1 = __importDefault(require("../functions/http/oauth.error.response"));
const attach_and_continue_1 = __importDefault(require("../functions/server/attach.and.continue"));
const build_upstream_context_1 = __importDefault(require("../functions/server/build.upstream.context"));
const deny_authorization_1 = __importDefault(require("../functions/server/deny.authorization"));
const load_pending_1 = __importDefault(require("../functions/server/load.pending"));
const resumeHandler = async (context, request) => {
    const pending = await (0, load_pending_1.default)(context, request);
    if (!pending)
        return (0, oauth_error_response_1.default)(400, 'invalid_request', 'unknown or already used state');
    let user = null;
    try {
        user = (await context.options.upstream.resume?.((0, build_upstream_context_1.default)(context, request, pending))) ?? null;
    }
    catch (error) {
        context.options.logger?.error?.('MCP upstream resume failed', { error: error instanceof Error ? error.message : String(error) });
    }
    return user?.id ? (0, attach_and_continue_1.default)(context, pending, user) : (0, deny_authorization_1.default)(context, pending);
};
exports.default = resumeHandler;
//# sourceMappingURL=resume.handler.js.map