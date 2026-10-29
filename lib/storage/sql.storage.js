'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const optional_date_1 = __importDefault(require("../functions/sql/optional.date"));
const row_to_client_1 = __importDefault(require("../functions/sql/row.to.client"));
const row_to_code_1 = __importDefault(require("../functions/sql/row.to.code"));
const row_to_pending_1 = __importDefault(require("../functions/sql/row.to.pending"));
const row_to_refresh_token_1 = __importDefault(require("../functions/sql/row.to.refresh.token"));
const sql_schema_1 = __importDefault(require("../functions/sql/sql.schema"));
const to_dialect_sql_1 = __importDefault(require("../functions/sql/to.dialect.sql"));
class SqlStorage {
    executor;
    dialect;
    prefix;
    constructor(executor, dialect, options = {}) {
        this.executor = executor;
        this.dialect = dialect;
        this.prefix = options.tablePrefix ?? 'mcp_oauth_';
    }
    async migrate() {
        for (const statement of (0, sql_schema_1.default)(this.dialect, this.prefix))
            await this.run(statement, []);
    }
    async run(sql, params) {
        return (await this.executor((0, to_dialect_sql_1.default)(sql, this.dialect), params)) ?? [];
    }
    async first(sql, params) {
        return (await this.run(sql, params))[0];
    }
    async getClient(clientId) {
        const row = await this.first(`SELECT * FROM ${this.prefix}clients WHERE client_id = ?`, [clientId]);
        return row ? (0, row_to_client_1.default)(row) : null;
    }
    async saveClient(client) {
        await this.run(`INSERT INTO ${this.prefix}clients (client_id, client_name, redirect_uris, application_type, token_endpoint_auth_method, grant_types, response_types, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            client.clientId,
            client.clientName ?? null,
            JSON.stringify(client.redirectUris),
            client.applicationType ?? null,
            client.tokenEndpointAuthMethod,
            JSON.stringify(client.grantTypes),
            JSON.stringify(client.responseTypes),
            client.createdAt.getTime()
        ]);
    }
    async savePendingAuthorization(pending) {
        await this.run(`INSERT INTO ${this.prefix}pending_authorizations (state_id, client_id, client_name, redirect_uri, code_challenge, resource, client_state, upstream_code_verifier, user_id, user_display_name, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            pending.stateId,
            pending.clientId,
            pending.clientName ?? null,
            pending.redirectUri,
            pending.codeChallenge,
            pending.resource,
            pending.clientState ?? null,
            pending.upstreamCodeVerifier ?? null,
            pending.userId ?? null,
            pending.userDisplayName ?? null,
            pending.expiresAt.getTime()
        ]);
    }
    async getPendingAuthorization(stateId, now) {
        const row = await this.first(`SELECT * FROM ${this.prefix}pending_authorizations WHERE state_id = ? AND expires_at > ?`, [stateId, now.getTime()]);
        return row ? (0, row_to_pending_1.default)(row) : null;
    }
    async attachUserToPendingAuthorization(stateId, userId, now, displayName) {
        const row = await this.first(`UPDATE ${this.prefix}pending_authorizations SET user_id = ?, user_display_name = ? WHERE state_id = ? AND expires_at > ? AND user_id IS NULL RETURNING *`, [userId, displayName ?? null, stateId, now.getTime()]);
        return row ? (0, row_to_pending_1.default)(row) : null;
    }
    async takePendingAuthorization(stateId, filter) {
        let userClause = '';
        if (true === filter.hasUser)
            userClause = ' AND user_id IS NOT NULL';
        if (false === filter.hasUser)
            userClause = ' AND user_id IS NULL';
        const row = await this.first(`DELETE FROM ${this.prefix}pending_authorizations WHERE state_id = ? AND expires_at > ?${userClause} RETURNING *`, [
            stateId,
            filter.now.getTime()
        ]);
        return row ? (0, row_to_pending_1.default)(row) : null;
    }
    async deletePendingAuthorization(stateId) {
        await this.run(`DELETE FROM ${this.prefix}pending_authorizations WHERE state_id = ?`, [stateId]);
    }
    async saveAuthorizationCode(code) {
        await this.run(`INSERT INTO ${this.prefix}authorization_codes (code_hash, client_id, redirect_uri, code_challenge, resource, user_id, used_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [code.codeHash, code.clientId, code.redirectUri, code.codeChallenge, code.resource, code.userId, (0, optional_date_1.default)(code.usedAt), code.expiresAt.getTime()]);
    }
    async claimAuthorizationCode(codeHash, now) {
        const row = await this.first(`UPDATE ${this.prefix}authorization_codes SET used_at = ? WHERE code_hash = ? AND used_at IS NULL AND expires_at > ? RETURNING *`, [
            now.getTime(),
            codeHash,
            now.getTime()
        ]);
        return row ? (0, row_to_code_1.default)(row) : null;
    }
    async saveRefreshToken(token) {
        await this.run(`INSERT INTO ${this.prefix}refresh_tokens (token_hash, family_id, client_id, user_id, resource, used_at, revoked_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [token.tokenHash, token.familyId, token.clientId, token.userId, token.resource, (0, optional_date_1.default)(token.usedAt), (0, optional_date_1.default)(token.revokedAt), token.expiresAt.getTime()]);
    }
    async findRefreshToken(tokenHash) {
        const row = await this.first(`SELECT * FROM ${this.prefix}refresh_tokens WHERE token_hash = ?`, [tokenHash]);
        return row ? (0, row_to_refresh_token_1.default)(row) : null;
    }
    async claimRefreshToken(tokenHash, now) {
        const row = await this.first(`UPDATE ${this.prefix}refresh_tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL AND revoked_at IS NULL AND expires_at > ? RETURNING *`, [now.getTime(), tokenHash, now.getTime()]);
        return row ? (0, row_to_refresh_token_1.default)(row) : null;
    }
    async revokeRefreshTokenFamily(familyId, now) {
        await this.run(`UPDATE ${this.prefix}refresh_tokens SET revoked_at = ? WHERE family_id = ? AND revoked_at IS NULL`, [now.getTime(), familyId]);
    }
    async hasConsent(clientId, userId) {
        return !!(await this.first(`SELECT 1 AS found FROM ${this.prefix}consents WHERE client_id = ? AND user_id = ?`, [clientId, userId]));
    }
    async upsertConsent(consent) {
        await this.run(`INSERT INTO ${this.prefix}consents (client_id, user_id, created_at) VALUES (?, ?, ?) ON CONFLICT (client_id, user_id) DO NOTHING`, [
            consent.clientId,
            consent.userId,
            Date.now()
        ]);
    }
    async deleteExpired(now) {
        for (const table of ['pending_authorizations', 'authorization_codes', 'refresh_tokens']) {
            await this.run(`DELETE FROM ${this.prefix}${table} WHERE expires_at <= ?`, [now.getTime()]);
        }
    }
}
exports.default = SqlStorage;
//# sourceMappingURL=sql.storage.js.map