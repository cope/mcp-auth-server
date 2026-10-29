'use strict';

import MongoStorage from '../../src/storage/mongodb.storage';
import type MongoStorageOptionsType from '../../src/types/mongo.storage.options.type';
import fakeMongoDb from '../helpers/fake.mongo.db';

const now = new Date('2026-01-01T00:00:00Z');
const later = new Date(now.getTime() + 60_000);

const sysTools: MongoStorageOptionsType = {userIdField: 'employeeId', userIdToDb: (userId) => Number(userId), userIdFromDb: (value) => String(value)};

const setup = (options?: MongoStorageOptionsType) => {
	const fake = fakeMongoDb();
	const storage = new MongoStorage(fake.db, options);
	const col = (name: string) => fake.collections.get(name)!;
	return {fake, storage, col};
};

const pendingDoc = {
	stateId: 's1',
	clientId: 'c1',
	clientName: 'Name',
	redirectUri: 'https://a/cb',
	codeChallenge: 'ch',
	resource: 'r',
	clientState: 'cs',
	upstreamCodeVerifier: 'uv',
	userDisplayName: 'User',
	expiresAt: later
};

const codeDoc = {codeHash: 'h', clientId: 'c1', redirectUri: 'https://a/cb', codeChallenge: 'ch', resource: 'r', userId: 'u1', usedAt: now, expiresAt: later};
const refreshDoc = {tokenHash: 't', familyId: 'f', clientId: 'c1', userId: 'u1', resource: 'r', usedAt: now, revokedAt: now, expiresAt: later};

describe('mongodb.storage tests', () => {
	it('should be defined', () => {
		expect(MongoStorage).toBeDefined();
		expect(setup().storage).toBeInstanceOf(MongoStorage);
	});

	describe('collections', () => {
		it('should use the default collection names', () => {
			const {fake} = setup();
			expect(fake.collection.mock.calls.map((call) => call[0])).toEqual([
				'mcp_oauth_clients',
				'mcp_oauth_pending_authorizations',
				'mcp_oauth_authorization_codes',
				'mcp_oauth_refresh_tokens',
				'mcp_oauth_consents'
			]);
		});

		it('should use custom collection names', () => {
			const {fake} = setup({collections: {clients: 'a', pendingAuthorizations: 'b', authorizationCodes: 'c', refreshTokens: 'd', consents: 'e'}});
			expect(fake.collection.mock.calls.map((call) => call[0])).toEqual(['a', 'b', 'c', 'd', 'e']);
		});
	});

	describe('ensureIndexes', () => {
		it('should create unique and TTL indexes', async () => {
			const {storage, col} = setup();
			await storage.ensureIndexes();
			expect(col('mcp_oauth_clients').createIndex).toHaveBeenCalledWith({clientId: 1}, {unique: true});
			expect(col('mcp_oauth_pending_authorizations').createIndex).toHaveBeenCalledWith({stateId: 1}, {unique: true});
			expect(col('mcp_oauth_pending_authorizations').createIndex).toHaveBeenCalledWith({expiresAt: 1}, {expireAfterSeconds: 0});
			expect(col('mcp_oauth_authorization_codes').createIndex).toHaveBeenCalledWith({codeHash: 1}, {unique: true});
			expect(col('mcp_oauth_authorization_codes').createIndex).toHaveBeenCalledWith({expiresAt: 1}, {expireAfterSeconds: 0});
			expect(col('mcp_oauth_refresh_tokens').createIndex).toHaveBeenCalledWith({tokenHash: 1}, {unique: true});
			expect(col('mcp_oauth_refresh_tokens').createIndex).toHaveBeenCalledWith({familyId: 1});
			expect(col('mcp_oauth_refresh_tokens').createIndex).toHaveBeenCalledWith({expiresAt: 1}, {expireAfterSeconds: 0});
			expect(col('mcp_oauth_consents').createIndex).toHaveBeenCalledWith({clientId: 1, userId: 1}, {unique: true});
		});

		it('should index the custom user id field on consents', async () => {
			const {storage, col} = setup(sysTools);
			await storage.ensureIndexes();
			expect(col('mcp_oauth_consents').createIndex).toHaveBeenCalledWith({clientId: 1, employeeId: 1}, {unique: true});
		});
	});

	describe('clients', () => {
		it('should return null when the client is missing', async () => {
			const {storage, col} = setup();
			expect(await storage.getClient('c1')).toBeNull();
			expect(col('mcp_oauth_clients').findOne).toHaveBeenCalledWith({clientId: 'c1'});
		});

		it('should map a stored client', async () => {
			const {storage, col} = setup();
			col('mcp_oauth_clients').findOne.mockResolvedValue({
				clientId: 'c1',
				clientName: 'Name',
				redirectUris: ['x'],
				applicationType: 'native',
				grantTypes: ['authorization_code'],
				responseTypes: ['code'],
				createdAt: now
			});
			expect(await storage.getClient('c1')).toEqual({
				clientId: 'c1',
				clientName: 'Name',
				redirectUris: ['x'],
				applicationType: 'native',
				tokenEndpointAuthMethod: 'none',
				grantTypes: ['authorization_code'],
				responseTypes: ['code'],
				createdAt: now
			});
		});

		it('should map null optionals to undefined', async () => {
			const {storage, col} = setup();
			col('mcp_oauth_clients').findOne.mockResolvedValue({
				clientId: 'c1',
				clientName: null,
				applicationType: null,
				redirectUris: [],
				grantTypes: [],
				responseTypes: [],
				createdAt: now
			});
			const found = await storage.getClient('c1');
			expect(found?.clientName).toBeUndefined();
			expect(found?.applicationType).toBeUndefined();
		});

		it('should insert a client', async () => {
			const {storage, col} = setup();
			await storage.saveClient({clientId: 'c1', redirectUris: ['x'], tokenEndpointAuthMethod: 'none', grantTypes: ['a'], responseTypes: ['code'], createdAt: now});
			expect(col('mcp_oauth_clients').insertOne).toHaveBeenCalledWith({
				clientId: 'c1',
				clientName: undefined,
				redirectUris: ['x'],
				applicationType: undefined,
				tokenEndpointAuthMethod: 'none',
				grantTypes: ['a'],
				responseTypes: ['code'],
				createdAt: now,
				updatedAt: now
			});
		});
	});

	describe('pending authorizations', () => {
		const record = {stateId: 's1', clientId: 'c1', redirectUri: 'u', codeChallenge: 'ch', resource: 'r', expiresAt: later};

		it('should save without a user id', async () => {
			const {storage, col} = setup();
			await storage.savePendingAuthorization(record);
			const doc = col('mcp_oauth_pending_authorizations').insertOne.mock.calls[0][0];
			expect(doc).toMatchObject({...record, codeChallengeMethod: 'S256'});
			expect('userId' in doc).toBe(false);
			expect(doc.createdAt).toBeInstanceOf(Date);
		});

		it('should save with a mapped user id', async () => {
			const {storage, col} = setup(sysTools);
			await storage.savePendingAuthorization({...record, userId: '42'});
			const doc = col('mcp_oauth_pending_authorizations').insertOne.mock.calls[0][0];
			expect(doc.employeeId).toBe(42);
			expect('userId' in doc).toBe(false);
		});

		it('should save with a default user id', async () => {
			const {storage, col} = setup();
			await storage.savePendingAuthorization({...record, userId: 'u1'});
			expect(col('mcp_oauth_pending_authorizations').insertOne.mock.calls[0][0].userId).toBe('u1');
		});

		it('should return null when pending is missing', async () => {
			const {storage, col} = setup();
			expect(await storage.getPendingAuthorization('s1', now)).toBeNull();
			expect(col('mcp_oauth_pending_authorizations').findOne).toHaveBeenCalledWith({stateId: 's1', expiresAt: {$gt: now}});
		});

		it('should map a pending document without a user', async () => {
			const {storage, col} = setup();
			col('mcp_oauth_pending_authorizations').findOne.mockResolvedValue(pendingDoc);
			expect(await storage.getPendingAuthorization('s1', now)).toEqual({...pendingDoc, userId: undefined});
		});

		it('should map null optionals and a null user to undefined', async () => {
			const {storage, col} = setup();
			col('mcp_oauth_pending_authorizations').findOne.mockResolvedValue({
				stateId: 's1',
				clientId: 'c1',
				redirectUri: 'u',
				codeChallenge: 'ch',
				resource: 'r',
				clientName: null,
				clientState: null,
				upstreamCodeVerifier: null,
				userId: null,
				userDisplayName: null,
				expiresAt: later
			});
			const found = await storage.getPendingAuthorization('s1', now);
			expect(found?.clientName).toBeUndefined();
			expect(found?.clientState).toBeUndefined();
			expect(found?.upstreamCodeVerifier).toBeUndefined();
			expect(found?.userId).toBeUndefined();
			expect(found?.userDisplayName).toBeUndefined();
		});

		it('should map a stored user id through userIdFromDb', async () => {
			const {storage, col} = setup(sysTools);
			col('mcp_oauth_pending_authorizations').findOne.mockResolvedValue({...pendingDoc, employeeId: 42});
			expect((await storage.getPendingAuthorization('s1', now))?.userId).toBe('42');
		});

		it('should attach a user with the not-yet-attached filter', async () => {
			const {storage, col} = setup(sysTools);
			col('mcp_oauth_pending_authorizations').findOneAndUpdate.mockResolvedValue({...pendingDoc, employeeId: 42});
			const attached = await storage.attachUserToPendingAuthorization('s1', '42', now, 'User');
			expect(attached?.userId).toBe('42');
			expect(col('mcp_oauth_pending_authorizations').findOneAndUpdate).toHaveBeenCalledWith(
				{stateId: 's1', expiresAt: {$gt: now}, employeeId: {$exists: false}},
				{$set: {employeeId: 42, userDisplayName: 'User', updatedAt: now}},
				{returnDocument: 'after'}
			);
		});

		it('should return null when attach loses', async () => {
			const {storage} = setup();
			expect(await storage.attachUserToPendingAuthorization('s1', 'u1', now)).toBeNull();
		});

		it('should require an existing user when hasUser is true', async () => {
			const {storage, col} = setup();
			col('mcp_oauth_pending_authorizations').findOneAndDelete.mockResolvedValue({...pendingDoc, userId: 'u1'});
			expect((await storage.takePendingAuthorization('s1', {now, hasUser: true}))?.userId).toBe('u1');
			expect(col('mcp_oauth_pending_authorizations').findOneAndDelete).toHaveBeenCalledWith({stateId: 's1', expiresAt: {$gt: now}, userId: {$exists: true}});
		});

		it('should require a missing user when hasUser is false', async () => {
			const {storage, col} = setup();
			expect(await storage.takePendingAuthorization('s1', {now, hasUser: false})).toBeNull();
			expect(col('mcp_oauth_pending_authorizations').findOneAndDelete).toHaveBeenCalledWith({stateId: 's1', expiresAt: {$gt: now}, userId: {$exists: false}});
		});

		it('should not filter on the user when hasUser is undefined', async () => {
			const {storage, col} = setup();
			await storage.takePendingAuthorization('s1', {now});
			expect(col('mcp_oauth_pending_authorizations').findOneAndDelete).toHaveBeenCalledWith({stateId: 's1', expiresAt: {$gt: now}});
		});

		it('should delete a pending authorization', async () => {
			const {storage, col} = setup();
			await storage.deletePendingAuthorization('s1');
			expect(col('mcp_oauth_pending_authorizations').deleteOne).toHaveBeenCalledWith({stateId: 's1'});
		});
	});

	describe('authorization codes', () => {
		it('should save with a mapped user id', async () => {
			const {storage, col} = setup(sysTools);
			await storage.saveAuthorizationCode({codeHash: 'h', clientId: 'c1', redirectUri: 'u', codeChallenge: 'ch', resource: 'r', userId: '42', expiresAt: later});
			const doc = col('mcp_oauth_authorization_codes').insertOne.mock.calls[0][0];
			expect(doc.employeeId).toBe(42);
			expect('userId' in doc).toBe(false);
			expect(doc.createdAt).toBeInstanceOf(Date);
		});

		it('should claim a code once', async () => {
			const {storage, col} = setup(sysTools);
			col('mcp_oauth_authorization_codes').findOneAndUpdate.mockResolvedValue({...codeDoc, employeeId: 42});
			const claimed = await storage.claimAuthorizationCode('h', now);
			expect(claimed).toEqual({codeHash: 'h', clientId: 'c1', redirectUri: 'https://a/cb', codeChallenge: 'ch', resource: 'r', userId: '42', usedAt: now, expiresAt: later});
			expect(col('mcp_oauth_authorization_codes').findOneAndUpdate).toHaveBeenCalledWith(
				{codeHash: 'h', usedAt: {$exists: false}, expiresAt: {$gt: now}},
				{$set: {usedAt: now, updatedAt: now}},
				{returnDocument: 'after'}
			);
		});

		it('should map a code without usedAt', async () => {
			const {storage, col} = setup();
			col('mcp_oauth_authorization_codes').findOneAndUpdate.mockResolvedValue({...codeDoc, usedAt: null});
			expect((await storage.claimAuthorizationCode('h', now))?.usedAt).toBeUndefined();
		});

		it('should return null when the claim loses', async () => {
			const {storage} = setup();
			expect(await storage.claimAuthorizationCode('h', now)).toBeNull();
		});
	});

	describe('refresh tokens', () => {
		it('should save with a mapped user id', async () => {
			const {storage, col} = setup(sysTools);
			await storage.saveRefreshToken({tokenHash: 't', familyId: 'f', clientId: 'c1', userId: '42', resource: 'r', expiresAt: later});
			const doc = col('mcp_oauth_refresh_tokens').insertOne.mock.calls[0][0];
			expect(doc.employeeId).toBe(42);
			expect('userId' in doc).toBe(false);
		});

		it('should return null when the token is missing', async () => {
			const {storage, col} = setup();
			expect(await storage.findRefreshToken('t')).toBeNull();
			expect(col('mcp_oauth_refresh_tokens').findOne).toHaveBeenCalledWith({tokenHash: 't'});
		});

		it('should map a stored token', async () => {
			const {storage, col} = setup();
			col('mcp_oauth_refresh_tokens').findOne.mockResolvedValue(refreshDoc);
			expect(await storage.findRefreshToken('t')).toEqual(refreshDoc);
		});

		it('should map a token without usedAt and revokedAt', async () => {
			const {storage, col} = setup();
			col('mcp_oauth_refresh_tokens').findOne.mockResolvedValue({...refreshDoc, usedAt: null, revokedAt: undefined});
			const found = await storage.findRefreshToken('t');
			expect(found?.usedAt).toBeUndefined();
			expect(found?.revokedAt).toBeUndefined();
		});

		it('should claim a token once', async () => {
			const {storage, col} = setup();
			col('mcp_oauth_refresh_tokens').findOneAndUpdate.mockResolvedValue(refreshDoc);
			expect(await storage.claimRefreshToken('t', now)).toEqual(refreshDoc);
			expect(col('mcp_oauth_refresh_tokens').findOneAndUpdate).toHaveBeenCalledWith(
				{tokenHash: 't', usedAt: {$exists: false}, revokedAt: {$exists: false}, expiresAt: {$gt: now}},
				{$set: {usedAt: now, updatedAt: now}},
				{returnDocument: 'after'}
			);
		});

		it('should return null when the claim loses', async () => {
			const {storage} = setup();
			expect(await storage.claimRefreshToken('t', now)).toBeNull();
		});

		it('should revoke a family', async () => {
			const {storage, col} = setup();
			await storage.revokeRefreshTokenFamily('f', now);
			expect(col('mcp_oauth_refresh_tokens').updateMany).toHaveBeenCalledWith({familyId: 'f', revokedAt: {$exists: false}}, {$set: {revokedAt: now, updatedAt: now}});
		});
	});

	describe('consents', () => {
		it('should report a missing consent', async () => {
			const {storage, col} = setup(sysTools);
			expect(await storage.hasConsent('c1', '42')).toBe(false);
			expect(col('mcp_oauth_consents').findOne).toHaveBeenCalledWith({clientId: 'c1', employeeId: 42}, {projection: {_id: 1}});
		});

		it('should report an existing consent', async () => {
			const {storage, col} = setup();
			col('mcp_oauth_consents').findOne.mockResolvedValue({_id: 1});
			expect(await storage.hasConsent('c1', 'u1')).toBe(true);
		});

		it('should upsert a consent', async () => {
			const {storage, col} = setup(sysTools);
			await storage.upsertConsent({clientId: 'c1', userId: '42'});
			const [filter, update, options] = col('mcp_oauth_consents').updateOne.mock.calls[0];
			expect(filter).toEqual({clientId: 'c1', employeeId: 42});
			expect(update.$setOnInsert).toMatchObject({clientId: 'c1', employeeId: 42});
			expect(options).toEqual({upsert: true});
		});

		it('should swallow duplicate key errors', async () => {
			const {storage, col} = setup();
			col('mcp_oauth_consents').updateOne.mockRejectedValue(Object.assign(new Error('dup'), {code: 11000}));
			await expect(storage.upsertConsent({clientId: 'c1', userId: 'u1'})).resolves.toBeUndefined();
		});

		it('should rethrow other errors', async () => {
			const {storage, col} = setup();
			col('mcp_oauth_consents').updateOne.mockRejectedValue(Object.assign(new Error('boom'), {code: 1}));
			await expect(storage.upsertConsent({clientId: 'c1', userId: 'u1'})).rejects.toThrow('boom');
		});
	});

	describe('deleteExpired', () => {
		it('should delete expired documents from the three expiring collections', async () => {
			const {storage, col} = setup();
			await storage.deleteExpired(now);
			for (const name of ['mcp_oauth_pending_authorizations', 'mcp_oauth_authorization_codes', 'mcp_oauth_refresh_tokens']) {
				expect(col(name).deleteMany).toHaveBeenCalledWith({expiresAt: {$lte: now}});
			}
			expect(col('mcp_oauth_clients').deleteMany).not.toHaveBeenCalled();
			expect(col('mcp_oauth_consents').deleteMany).not.toHaveBeenCalled();
		});
	});
});
