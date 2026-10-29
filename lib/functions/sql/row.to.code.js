'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const optional_number_1 = __importDefault(require("./optional.number"));
const rowToCode = (row) => {
    const usedAt = (0, optional_number_1.default)(row.used_at);
    return {
        codeHash: String(row.code_hash),
        clientId: String(row.client_id),
        redirectUri: String(row.redirect_uri),
        codeChallenge: String(row.code_challenge),
        resource: String(row.resource),
        userId: String(row.user_id),
        usedAt: undefined === usedAt ? undefined : new Date(usedAt),
        expiresAt: new Date(Number(row.expires_at))
    };
};
exports.default = rowToCode;
//# sourceMappingURL=row.to.code.js.map