'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
class MemoryStorage {
    clients = new Map();
    pending = new Map();
    codes = new Map();
    refreshTokens = new Map();
    consents = new Set();
    async getClient(clientId) {
        const client = this.clients.get(clientId);
        return client ? { ...client } : null;
    }
    async saveClient(client) {
        this.clients.set(client.clientId, { ...client });
    }
    async savePendingAuthorization(pending) {
        this.pending.set(pending.stateId, { ...pending });
    }
    async getPendingAuthorization(stateId, now) {
        const found = this.pending.get(stateId);
        return found && found.expiresAt > now ? { ...found } : null;
    }
    async attachUserToPendingAuthorization(stateId, userId, now, displayName) {
        const found = this.pending.get(stateId);
        if (!found || found.expiresAt <= now || found.userId)
            return null;
        found.userId = userId;
        found.userDisplayName = displayName;
        return { ...found };
    }
    async takePendingAuthorization(stateId, filter) {
        const found = this.pending.get(stateId);
        if (!found || found.expiresAt <= filter.now)
            return null;
        if (undefined !== filter.hasUser && filter.hasUser !== !!found.userId)
            return null;
        this.pending.delete(stateId);
        return { ...found };
    }
    async deletePendingAuthorization(stateId) {
        this.pending.delete(stateId);
    }
    async saveAuthorizationCode(code) {
        this.codes.set(code.codeHash, { ...code });
    }
    async claimAuthorizationCode(codeHash, now) {
        const found = this.codes.get(codeHash);
        if (!found || found.usedAt || found.expiresAt <= now)
            return null;
        found.usedAt = now;
        return { ...found };
    }
    async saveRefreshToken(token) {
        this.refreshTokens.set(token.tokenHash, { ...token });
    }
    async findRefreshToken(tokenHash) {
        const found = this.refreshTokens.get(tokenHash);
        return found ? { ...found } : null;
    }
    async claimRefreshToken(tokenHash, now) {
        const found = this.refreshTokens.get(tokenHash);
        if (!found || found.usedAt || found.revokedAt || found.expiresAt <= now)
            return null;
        found.usedAt = now;
        return { ...found };
    }
    async revokeRefreshTokenFamily(familyId, now) {
        for (const token of this.refreshTokens.values())
            if (token.familyId === familyId && !token.revokedAt)
                token.revokedAt = now;
    }
    async hasConsent(clientId, userId) {
        return this.consents.has(JSON.stringify([clientId, userId]));
    }
    async upsertConsent(consent) {
        this.consents.add(JSON.stringify([consent.clientId, consent.userId]));
    }
    async deleteExpired(now) {
        for (const [key, value] of this.pending)
            if (value.expiresAt <= now)
                this.pending.delete(key);
        for (const [key, value] of this.codes)
            if (value.expiresAt <= now)
                this.codes.delete(key);
        for (const [key, value] of this.refreshTokens)
            if (value.expiresAt <= now)
                this.refreshTokens.delete(key);
    }
}
exports.default = MemoryStorage;
//# sourceMappingURL=memory.storage.js.map