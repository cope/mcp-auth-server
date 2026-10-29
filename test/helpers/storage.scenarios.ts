'use strict';

import assert from 'node:assert/strict';

import type AuthorizationCodeRecordType from '../../src/types/authorization.code.record.type';
import type ClientRecordType from '../../src/types/client.record.type';
import type IStorage from '../../src/types/i.storage';
import type PendingAuthorizationType from '../../src/types/pending.authorization.type';
import type RefreshTokenRecordType from '../../src/types/refresh.token.record.type';

const now = new Date('2026-01-01T00:00:00Z');
const later = new Date(now.getTime() + 60_000);
const earlier = new Date(now.getTime() - 60_000);

const client = (overrides: Partial<ClientRecordType> = {}): ClientRecordType => ({
	clientId: 'client-1',
	clientName: 'Client One',
	redirectUris: ['http://localhost:3000/cb', 'cursor://anysphere/cb'],
	applicationType: 'native',
	tokenEndpointAuthMethod: 'none',
	grantTypes: ['authorization_code', 'refresh_token'],
	responseTypes: ['code'],
	createdAt: now,
	...overrides
});

const pending = (overrides: Partial<PendingAuthorizationType> = {}): PendingAuthorizationType => ({
	stateId: 'state-1',
	clientId: 'client-1',
	clientName: 'Client One',
	redirectUri: 'http://localhost:3000/cb',
	codeChallenge: 'c'.repeat(43),
	resource: 'https://mcp.test/mcp',
	clientState: 'client-state',
	upstreamCodeVerifier: 'verifier',
	expiresAt: later,
	...overrides
});

const code = (overrides: Partial<AuthorizationCodeRecordType> = {}): AuthorizationCodeRecordType => ({
	codeHash: 'code-hash-1',
	clientId: 'client-1',
	redirectUri: 'http://localhost:3000/cb',
	codeChallenge: 'c'.repeat(43),
	resource: 'https://mcp.test/mcp',
	userId: '1001',
	expiresAt: later,
	...overrides
});

const refresh = (overrides: Partial<RefreshTokenRecordType> = {}): RefreshTokenRecordType => ({
	tokenHash: 'refresh-hash-1',
	familyId: 'family-1',
	clientId: 'client-1',
	userId: '1001',
	resource: 'https://mcp.test/mcp',
	expiresAt: later,
	...overrides
});

const nonNull = <T>(results: (T | null)[]): T[] => results.filter((result): result is T => null !== result);
const match = (actual: unknown, expected: object): void => assert.partialDeepStrictEqual(actual, expected);

export type StorageScenarioType = {name: string; run: (storage: IStorage) => Promise<void>};

const storageScenarios: StorageScenarioType[] = [
	{
		name: 'round-trips clients',
		run: async (storage) => {
			assert.equal(await storage.getClient('client-1'), null);
			await storage.saveClient(client());
			const found = await storage.getClient('client-1');
			match(found, {clientId: 'client-1', clientName: 'Client One', applicationType: 'native', tokenEndpointAuthMethod: 'none'});
			assert.deepEqual(found?.redirectUris, ['http://localhost:3000/cb', 'cursor://anysphere/cb']);
			assert.deepEqual(found?.grantTypes, ['authorization_code', 'refresh_token']);
			assert.equal(found?.createdAt.getTime(), now.getTime());
		}
	},
	{
		name: 'stores clients without optional fields',
		run: async (storage) => {
			await storage.saveClient(client({clientId: 'bare', clientName: undefined, applicationType: undefined}));
			const found = await storage.getClient('bare');
			assert.equal(found?.clientName, undefined);
			assert.equal(found?.applicationType, undefined);
		}
	},
	{
		name: 'round-trips pending authorizations and hides expired ones',
		run: async (storage) => {
			await storage.savePendingAuthorization(pending());
			match(await storage.getPendingAuthorization('state-1', now), {stateId: 'state-1', clientState: 'client-state', upstreamCodeVerifier: 'verifier'});
			assert.equal((await storage.getPendingAuthorization('state-1', now))?.userId, undefined);
			assert.equal(await storage.getPendingAuthorization('state-1', later), null);
			assert.equal(await storage.getPendingAuthorization('missing', now), null);
		}
	},
	{
		name: 'attaches a user once',
		run: async (storage) => {
			await storage.savePendingAuthorization(pending());
			const attached = await storage.attachUserToPendingAuthorization('state-1', '1001', now, 'User One');
			assert.equal(attached?.userId, '1001');
			assert.equal(attached?.userDisplayName, 'User One');
			assert.equal(await storage.attachUserToPendingAuthorization('state-1', '1002', now), null);
			assert.equal((await storage.getPendingAuthorization('state-1', now))?.userId, '1001');
		}
	},
	{
		name: 'refuses to attach a user to an expired pending authorization',
		run: async (storage) => {
			await storage.savePendingAuthorization(pending({expiresAt: earlier}));
			assert.equal(await storage.attachUserToPendingAuthorization('state-1', '1001', now), null);
		}
	},
	{
		name: 'takes a pending authorization with the user filter',
		run: async (storage) => {
			await storage.savePendingAuthorization(pending());
			assert.equal(await storage.takePendingAuthorization('state-1', {now, hasUser: true}), null);
			await storage.attachUserToPendingAuthorization('state-1', '1001', now);
			assert.equal(await storage.takePendingAuthorization('state-1', {now, hasUser: false}), null);
			assert.equal((await storage.takePendingAuthorization('state-1', {now, hasUser: true}))?.userId, '1001');
			assert.equal(await storage.getPendingAuthorization('state-1', now), null);
		}
	},
	{
		name: 'takes without a user filter and respects expiry',
		run: async (storage) => {
			await storage.savePendingAuthorization(pending());
			await storage.savePendingAuthorization(pending({stateId: 'state-2', expiresAt: earlier}));
			assert.equal(await storage.takePendingAuthorization('state-2', {now}), null);
			assert.notEqual(await storage.takePendingAuthorization('state-1', {now}), null);
			assert.equal(await storage.takePendingAuthorization('state-1', {now}), null);
		}
	},
	{
		name: 'deletes pending authorizations',
		run: async (storage) => {
			await storage.savePendingAuthorization(pending());
			await storage.deletePendingAuthorization('state-1');
			assert.equal(await storage.getPendingAuthorization('state-1', now), null);
		}
	},
	{
		name: 'lets exactly one concurrent taker win a pending authorization',
		run: async (storage) => {
			await storage.savePendingAuthorization(pending());
			await storage.attachUserToPendingAuthorization('state-1', '1001', now);
			const results = await Promise.all(Array.from({length: 8}, () => storage.takePendingAuthorization('state-1', {now, hasUser: true})));
			assert.equal(nonNull(results).length, 1);
		}
	},
	{
		name: 'lets exactly one concurrent attach win',
		run: async (storage) => {
			await storage.savePendingAuthorization(pending());
			const results = await Promise.all(Array.from({length: 8}, (_, index) => storage.attachUserToPendingAuthorization('state-1', `${1000 + index}`, now)));
			assert.equal(nonNull(results).length, 1);
		}
	},
	{
		name: 'claims an authorization code once',
		run: async (storage) => {
			await storage.saveAuthorizationCode(code());
			const claimed = await storage.claimAuthorizationCode('code-hash-1', now);
			match(claimed, {codeHash: 'code-hash-1', userId: '1001', clientId: 'client-1'});
			assert.equal(await storage.claimAuthorizationCode('code-hash-1', now), null);
		}
	},
	{
		name: 'refuses expired and unknown authorization codes',
		run: async (storage) => {
			await storage.saveAuthorizationCode(code({expiresAt: earlier}));
			assert.equal(await storage.claimAuthorizationCode('code-hash-1', now), null);
			assert.equal(await storage.claimAuthorizationCode('missing', now), null);
		}
	},
	{
		name: 'lets exactly one concurrent claim win an authorization code',
		run: async (storage) => {
			await storage.saveAuthorizationCode(code());
			const results = await Promise.all(Array.from({length: 8}, () => storage.claimAuthorizationCode('code-hash-1', now)));
			assert.equal(nonNull(results).length, 1);
		}
	},
	{
		name: 'finds and claims a refresh token once',
		run: async (storage) => {
			await storage.saveRefreshToken(refresh());
			match(await storage.findRefreshToken('refresh-hash-1'), {familyId: 'family-1', userId: '1001'});
			assert.notEqual(await storage.claimRefreshToken('refresh-hash-1', now), null);
			assert.equal(await storage.claimRefreshToken('refresh-hash-1', now), null);
			assert.ok((await storage.findRefreshToken('refresh-hash-1'))?.usedAt instanceof Date);
		}
	},
	{
		name: 'refuses to claim expired or revoked refresh tokens',
		run: async (storage) => {
			await storage.saveRefreshToken(refresh({expiresAt: earlier}));
			assert.equal(await storage.claimRefreshToken('refresh-hash-1', now), null);
			await storage.saveRefreshToken(refresh({tokenHash: 'refresh-hash-2'}));
			await storage.revokeRefreshTokenFamily('family-1', now);
			assert.equal(await storage.claimRefreshToken('refresh-hash-2', now), null);
		}
	},
	{
		name: 'lets exactly one concurrent claim win a refresh token',
		run: async (storage) => {
			await storage.saveRefreshToken(refresh());
			const results = await Promise.all(Array.from({length: 8}, () => storage.claimRefreshToken('refresh-hash-1', now)));
			assert.equal(nonNull(results).length, 1);
		}
	},
	{
		name: 'revokes a whole family and nothing else',
		run: async (storage) => {
			await storage.saveRefreshToken(refresh({tokenHash: 'a'}));
			await storage.saveRefreshToken(refresh({tokenHash: 'b'}));
			await storage.saveRefreshToken(refresh({tokenHash: 'c', familyId: 'family-2'}));
			await storage.revokeRefreshTokenFamily('family-1', now);
			assert.equal((await storage.findRefreshToken('a'))?.revokedAt?.getTime(), now.getTime());
			assert.ok((await storage.findRefreshToken('b'))?.revokedAt instanceof Date);
			assert.equal((await storage.findRefreshToken('c'))?.revokedAt, undefined);
		}
	},
	{
		name: 'keeps the original revocation time when revoking twice',
		run: async (storage) => {
			await storage.saveRefreshToken(refresh());
			await storage.revokeRefreshTokenFamily('family-1', now);
			await storage.revokeRefreshTokenFamily('family-1', later);
			assert.equal((await storage.findRefreshToken('refresh-hash-1'))?.revokedAt?.getTime(), now.getTime());
		}
	},
	{
		name: 'upserts consents idempotently',
		run: async (storage) => {
			assert.equal(await storage.hasConsent('client-1', '1001'), false);
			await storage.upsertConsent({clientId: 'client-1', userId: '1001'});
			await Promise.all([storage.upsertConsent({clientId: 'client-1', userId: '1001'}), storage.upsertConsent({clientId: 'client-1', userId: '1001'})]);
			assert.equal(await storage.hasConsent('client-1', '1001'), true);
			assert.equal(await storage.hasConsent('client-1', '1002'), false);
			assert.equal(await storage.hasConsent('client-2', '1001'), false);
		}
	},
	{
		name: 'deletes expired records only',
		run: async (storage) => {
			await storage.savePendingAuthorization(pending({stateId: 'old', expiresAt: earlier}));
			await storage.savePendingAuthorization(pending({stateId: 'new'}));
			await storage.saveAuthorizationCode(code({codeHash: 'old-code', expiresAt: earlier}));
			await storage.saveAuthorizationCode(code({codeHash: 'new-code'}));
			await storage.saveRefreshToken(refresh({tokenHash: 'old-refresh', expiresAt: earlier}));
			await storage.saveRefreshToken(refresh({tokenHash: 'new-refresh'}));
			await storage.deleteExpired(now);
			assert.equal(await storage.findRefreshToken('old-refresh'), null);
			assert.notEqual(await storage.findRefreshToken('new-refresh'), null);
			assert.notEqual(await storage.claimAuthorizationCode('new-code', now), null);
			assert.notEqual(await storage.getPendingAuthorization('new', now), null);
		}
	}
];

export default storageScenarios;
