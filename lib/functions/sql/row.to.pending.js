'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const optional_text_1 = __importDefault(require("./optional.text"));
const rowToPending = (row) => ({
    stateId: String(row.state_id),
    clientId: String(row.client_id),
    clientName: (0, optional_text_1.default)(row.client_name),
    redirectUri: String(row.redirect_uri),
    codeChallenge: String(row.code_challenge),
    resource: String(row.resource),
    clientState: (0, optional_text_1.default)(row.client_state),
    upstreamCodeVerifier: (0, optional_text_1.default)(row.upstream_code_verifier),
    userId: (0, optional_text_1.default)(row.user_id),
    userDisplayName: (0, optional_text_1.default)(row.user_display_name),
    expiresAt: new Date(Number(row.expires_at))
});
exports.default = rowToPending;
//# sourceMappingURL=row.to.pending.js.map