'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
class MongoStorage {
    clients;
    pending;
    codes;
    refreshTokens;
    consents;
    userIdField;
    userIdToDb;
    userIdFromDb;
    constructor(db, options = {}) {
        this.clients = db.collection(options.collections?.clients ?? 'mcp_oauth_clients');
        this.pending = db.collection(options.collections?.pendingAuthorizations ?? 'mcp_oauth_pending_authorizations');
        this.codes = db.collection(options.collections?.authorizationCodes ?? 'mcp_oauth_authorization_codes');
        this.refreshTokens = db.collection(options.collections?.refreshTokens ?? 'mcp_oauth_refresh_tokens');
        this.consents = db.collection(options.collections?.consents ?? 'mcp_oauth_consents');
        this.userIdField = options.userIdField ?? 'userId';
        this.userIdToDb = options.userIdToDb ?? ((userId) => userId);
        this.userIdFromDb = options.userIdFromDb ?? ((value) => String(value));
    }
    async ensureIndexes() {
        await this.clients.createIndex({ clientId: 1 }, { unique: true });
        await this.pending.createIndex({ stateId: 1 }, { unique: true });
        await this.pending.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        await this.codes.createIndex({ codeHash: 1 }, { unique: true });
        await this.codes.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        await this.refreshTokens.createIndex({ tokenHash: 1 }, { unique: true });
        await this.refreshTokens.createIndex({ familyId: 1 });
        await this.refreshTokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        await this.consents.createIndex({ clientId: 1, [this.userIdField]: 1 }, { unique: true });
    }
    toClient(doc) {
        return {
            clientId: doc.clientId,
            clientName: doc.clientName ?? undefined,
            redirectUris: doc.redirectUris,
            applicationType: doc.applicationType ?? undefined,
            tokenEndpointAuthMethod: 'none',
            grantTypes: doc.grantTypes,
            responseTypes: doc.responseTypes,
            createdAt: doc.createdAt
        };
    }
    toPending(doc) {
        const userId = doc[this.userIdField];
        return {
            stateId: doc.stateId,
            clientId: doc.clientId,
            clientName: doc.clientName ?? undefined,
            redirectUri: doc.redirectUri,
            codeChallenge: doc.codeChallenge,
            resource: doc.resource,
            clientState: doc.clientState ?? undefined,
            upstreamCodeVerifier: doc.upstreamCodeVerifier ?? undefined,
            userId: undefined === userId || null === userId ? undefined : this.userIdFromDb(userId),
            userDisplayName: doc.userDisplayName ?? undefined,
            expiresAt: doc.expiresAt
        };
    }
    toCode(doc) {
        return {
            codeHash: doc.codeHash,
            clientId: doc.clientId,
            redirectUri: doc.redirectUri,
            codeChallenge: doc.codeChallenge,
            resource: doc.resource,
            userId: this.userIdFromDb(doc[this.userIdField]),
            usedAt: doc.usedAt ?? undefined,
            expiresAt: doc.expiresAt
        };
    }
    toRefreshToken(doc) {
        return {
            tokenHash: doc.tokenHash,
            familyId: doc.familyId,
            clientId: doc.clientId,
            userId: this.userIdFromDb(doc[this.userIdField]),
            resource: doc.resource,
            usedAt: doc.usedAt ?? undefined,
            revokedAt: doc.revokedAt ?? undefined,
            expiresAt: doc.expiresAt
        };
    }
    async getClient(clientId) {
        const doc = await this.clients.findOne({ clientId });
        return doc ? this.toClient(doc) : null;
    }
    async saveClient(client) {
        await this.clients.insertOne({
            clientId: client.clientId,
            clientName: client.clientName,
            redirectUris: client.redirectUris,
            applicationType: client.applicationType,
            tokenEndpointAuthMethod: client.tokenEndpointAuthMethod,
            grantTypes: client.grantTypes,
            responseTypes: client.responseTypes,
            createdAt: client.createdAt,
            updatedAt: client.createdAt
        });
    }
    async savePendingAuthorization(pending) {
        const { userId, ...rest } = pending;
        await this.pending.insertOne({
            ...rest,
            codeChallengeMethod: 'S256',
            ...(undefined === userId ? {} : { [this.userIdField]: this.userIdToDb(userId) }),
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
    async getPendingAuthorization(stateId, now) {
        const doc = await this.pending.findOne({ stateId, expiresAt: { $gt: now } });
        return doc ? this.toPending(doc) : null;
    }
    async attachUserToPendingAuthorization(stateId, userId, now, displayName) {
        const doc = await this.pending.findOneAndUpdate({ stateId, expiresAt: { $gt: now }, [this.userIdField]: { $exists: false } }, { $set: { [this.userIdField]: this.userIdToDb(userId), userDisplayName: displayName, updatedAt: now } }, { returnDocument: 'after' });
        return doc ? this.toPending(doc) : null;
    }
    async takePendingAuthorization(stateId, filter) {
        const query = { stateId, expiresAt: { $gt: filter.now } };
        if (undefined !== filter.hasUser)
            query[this.userIdField] = { $exists: filter.hasUser };
        const doc = await this.pending.findOneAndDelete(query);
        return doc ? this.toPending(doc) : null;
    }
    async deletePendingAuthorization(stateId) {
        await this.pending.deleteOne({ stateId });
    }
    async saveAuthorizationCode(code) {
        const { userId, ...rest } = code;
        await this.codes.insertOne({ ...rest, [this.userIdField]: this.userIdToDb(userId), createdAt: new Date(), updatedAt: new Date() });
    }
    async claimAuthorizationCode(codeHash, now) {
        const doc = await this.codes.findOneAndUpdate({ codeHash, usedAt: { $exists: false }, expiresAt: { $gt: now } }, { $set: { usedAt: now, updatedAt: now } }, { returnDocument: 'after' });
        return doc ? this.toCode(doc) : null;
    }
    async saveRefreshToken(token) {
        const { userId, ...rest } = token;
        await this.refreshTokens.insertOne({ ...rest, [this.userIdField]: this.userIdToDb(userId), createdAt: new Date(), updatedAt: new Date() });
    }
    async findRefreshToken(tokenHash) {
        const doc = await this.refreshTokens.findOne({ tokenHash });
        return doc ? this.toRefreshToken(doc) : null;
    }
    async claimRefreshToken(tokenHash, now) {
        const doc = await this.refreshTokens.findOneAndUpdate({ tokenHash, usedAt: { $exists: false }, revokedAt: { $exists: false }, expiresAt: { $gt: now } }, { $set: { usedAt: now, updatedAt: now } }, { returnDocument: 'after' });
        return doc ? this.toRefreshToken(doc) : null;
    }
    async revokeRefreshTokenFamily(familyId, now) {
        await this.refreshTokens.updateMany({ familyId, revokedAt: { $exists: false } }, { $set: { revokedAt: now, updatedAt: now } });
    }
    async hasConsent(clientId, userId) {
        return !!(await this.consents.findOne({ clientId, [this.userIdField]: this.userIdToDb(userId) }, { projection: { _id: 1 } }));
    }
    async upsertConsent(consent) {
        const filter = { clientId: consent.clientId, [this.userIdField]: this.userIdToDb(consent.userId) };
        try {
            await this.consents.updateOne(filter, { $setOnInsert: { ...filter, createdAt: new Date(), updatedAt: new Date() } }, { upsert: true });
        }
        catch (error) {
            if (11000 !== error.code)
                throw error;
        }
    }
    async deleteExpired(now) {
        for (const collection of [this.pending, this.codes, this.refreshTokens])
            await collection.deleteMany({ expiresAt: { $lte: now } });
    }
}
exports.default = MongoStorage;
//# sourceMappingURL=mongodb.storage.js.map