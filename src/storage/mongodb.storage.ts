'use strict';

import type {Collection, Db, Document} from 'mongodb';

import type AuthorizationCodeRecordType from '../types/authorization.code.record.type';
import type ClientRecordType from '../types/client.record.type';
import type ConsentRecordType from '../types/consent.record.type';
import type IStorage from '../types/i.storage';
import type MongoStorageOptionsType from '../types/mongo.storage.options.type';
import type PendingAuthorizationType from '../types/pending.authorization.type';
import type PendingFilterType from '../types/pending.filter.type';
import type RefreshTokenRecordType from '../types/refresh.token.record.type';

export default class MongoStorage implements IStorage {
	private readonly clients: Collection<Document>;
	private readonly pending: Collection<Document>;
	private readonly codes: Collection<Document>;
	private readonly refreshTokens: Collection<Document>;
	private readonly consents: Collection<Document>;
	private readonly userIdField: string;
	private readonly userIdToDb: (userId: string) => unknown;
	private readonly userIdFromDb: (value: unknown) => string;

	constructor(db: Db, options: MongoStorageOptionsType = {}) {
		this.clients = db.collection(options.collections?.clients ?? 'mcp_oauth_clients');
		this.pending = db.collection(options.collections?.pendingAuthorizations ?? 'mcp_oauth_pending_authorizations');
		this.codes = db.collection(options.collections?.authorizationCodes ?? 'mcp_oauth_authorization_codes');
		this.refreshTokens = db.collection(options.collections?.refreshTokens ?? 'mcp_oauth_refresh_tokens');
		this.consents = db.collection(options.collections?.consents ?? 'mcp_oauth_consents');
		this.userIdField = options.userIdField ?? 'userId';
		this.userIdToDb = options.userIdToDb ?? ((userId: string): unknown => userId);
		this.userIdFromDb = options.userIdFromDb ?? ((value: unknown): string => String(value));
	}

	async ensureIndexes(): Promise<void> {
		await this.clients.createIndex({clientId: 1}, {unique: true});
		await this.pending.createIndex({stateId: 1}, {unique: true});
		await this.pending.createIndex({expiresAt: 1}, {expireAfterSeconds: 0});
		await this.codes.createIndex({codeHash: 1}, {unique: true});
		await this.codes.createIndex({expiresAt: 1}, {expireAfterSeconds: 0});
		await this.refreshTokens.createIndex({tokenHash: 1}, {unique: true});
		await this.refreshTokens.createIndex({familyId: 1});
		await this.refreshTokens.createIndex({expiresAt: 1}, {expireAfterSeconds: 0});
		await this.consents.createIndex({clientId: 1, [this.userIdField]: 1}, {unique: true});
	}

	private toClient(doc: Document): ClientRecordType {
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

	private toPending(doc: Document): PendingAuthorizationType {
		const userId: unknown = doc[this.userIdField];
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

	private toCode(doc: Document): AuthorizationCodeRecordType {
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

	private toRefreshToken(doc: Document): RefreshTokenRecordType {
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

	async getClient(clientId: string): Promise<ClientRecordType | null> {
		const doc = await this.clients.findOne({clientId});
		return doc ? this.toClient(doc) : null;
	}

	async saveClient(client: ClientRecordType): Promise<void> {
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

	async savePendingAuthorization(pending: PendingAuthorizationType): Promise<void> {
		const {userId, ...rest} = pending;
		await this.pending.insertOne({
			...rest,
			codeChallengeMethod: 'S256',
			...(undefined === userId ? {} : {[this.userIdField]: this.userIdToDb(userId)}),
			createdAt: new Date(),
			updatedAt: new Date()
		});
	}

	async getPendingAuthorization(stateId: string, now: Date): Promise<PendingAuthorizationType | null> {
		const doc = await this.pending.findOne({stateId, expiresAt: {$gt: now}});
		return doc ? this.toPending(doc) : null;
	}

	async attachUserToPendingAuthorization(stateId: string, userId: string, now: Date, displayName?: string): Promise<PendingAuthorizationType | null> {
		const doc = await this.pending.findOneAndUpdate(
			{stateId, expiresAt: {$gt: now}, [this.userIdField]: {$exists: false}},
			{$set: {[this.userIdField]: this.userIdToDb(userId), userDisplayName: displayName, updatedAt: now}},
			{returnDocument: 'after'}
		);
		return doc ? this.toPending(doc) : null;
	}

	async takePendingAuthorization(stateId: string, filter: PendingFilterType): Promise<PendingAuthorizationType | null> {
		const query: Document = {stateId, expiresAt: {$gt: filter.now}};
		if (undefined !== filter.hasUser) query[this.userIdField] = {$exists: filter.hasUser};
		const doc = await this.pending.findOneAndDelete(query);
		return doc ? this.toPending(doc) : null;
	}

	async deletePendingAuthorization(stateId: string): Promise<void> {
		await this.pending.deleteOne({stateId});
	}

	async saveAuthorizationCode(code: AuthorizationCodeRecordType): Promise<void> {
		const {userId, ...rest} = code;
		await this.codes.insertOne({...rest, [this.userIdField]: this.userIdToDb(userId), createdAt: new Date(), updatedAt: new Date()});
	}

	async claimAuthorizationCode(codeHash: string, now: Date): Promise<AuthorizationCodeRecordType | null> {
		const doc = await this.codes.findOneAndUpdate(
			{codeHash, usedAt: {$exists: false}, expiresAt: {$gt: now}},
			{$set: {usedAt: now, updatedAt: now}},
			{returnDocument: 'after'}
		);
		return doc ? this.toCode(doc) : null;
	}

	async saveRefreshToken(token: RefreshTokenRecordType): Promise<void> {
		const {userId, ...rest} = token;
		await this.refreshTokens.insertOne({...rest, [this.userIdField]: this.userIdToDb(userId), createdAt: new Date(), updatedAt: new Date()});
	}

	async findRefreshToken(tokenHash: string): Promise<RefreshTokenRecordType | null> {
		const doc = await this.refreshTokens.findOne({tokenHash});
		return doc ? this.toRefreshToken(doc) : null;
	}

	async claimRefreshToken(tokenHash: string, now: Date): Promise<RefreshTokenRecordType | null> {
		const doc = await this.refreshTokens.findOneAndUpdate(
			{tokenHash, usedAt: {$exists: false}, revokedAt: {$exists: false}, expiresAt: {$gt: now}},
			{$set: {usedAt: now, updatedAt: now}},
			{returnDocument: 'after'}
		);
		return doc ? this.toRefreshToken(doc) : null;
	}

	async revokeRefreshTokenFamily(familyId: string, now: Date): Promise<void> {
		await this.refreshTokens.updateMany({familyId, revokedAt: {$exists: false}}, {$set: {revokedAt: now, updatedAt: now}});
	}

	async hasConsent(clientId: string, userId: string): Promise<boolean> {
		return !!(await this.consents.findOne({clientId, [this.userIdField]: this.userIdToDb(userId)}, {projection: {_id: 1}}));
	}

	async upsertConsent(consent: ConsentRecordType): Promise<void> {
		const filter: Document = {clientId: consent.clientId, [this.userIdField]: this.userIdToDb(consent.userId)};
		try {
			await this.consents.updateOne(filter, {$setOnInsert: {...filter, createdAt: new Date(), updatedAt: new Date()}}, {upsert: true});
		} catch (error) {
			if (11000 !== (error as {code?: number}).code) throw error;
		}
	}

	async deleteExpired(now: Date): Promise<void> {
		for (const collection of [this.pending, this.codes, this.refreshTokens]) await collection.deleteMany({expiresAt: {$lte: now}});
	}
}
