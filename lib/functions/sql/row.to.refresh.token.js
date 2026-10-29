'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const optional_number_1 = __importDefault(require("./optional.number"));
const rowToRefreshToken = (row) => {
    const usedAt = (0, optional_number_1.default)(row.used_at);
    const revokedAt = (0, optional_number_1.default)(row.revoked_at);
    return {
        tokenHash: String(row.token_hash),
        familyId: String(row.family_id),
        clientId: String(row.client_id),
        userId: String(row.user_id),
        resource: String(row.resource),
        usedAt: undefined === usedAt ? undefined : new Date(usedAt),
        revokedAt: undefined === revokedAt ? undefined : new Date(revokedAt),
        expiresAt: new Date(Number(row.expires_at))
    };
};
exports.default = rowToRefreshToken;
//# sourceMappingURL=row.to.refresh.token.js.map