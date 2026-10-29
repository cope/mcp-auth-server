'use strict';

import {SignJWT, exportJWK, generateKeyPair} from 'jose';

import verifyIdToken from '../../../src/functions/upstream/verify.id.token';

const issuer = 'https://idp.test';
const audience = 'client-1';

const makeKey = async (kid: string) => {
	const {publicKey, privateKey} = await generateKeyPair('RS256');
	return {privateKey, jwk: {...(await exportJWK(publicKey)), kid, alg: 'RS256', use: 'sig'}};
};

const sign = (privateKey: CryptoKey | any, kid: string) =>
	new SignJWT({sub: 'user-1'}).setProtectedHeader({alg: 'RS256', kid}).setIssuer(issuer).setAudience(audience).setIssuedAt().setExpirationTime('5m').sign(privateKey);

describe('verify.id.token tests', () => {
	it('should be defined', () => {
		expect(verifyIdToken).toBeDefined();
	});

	it('should verify a token with the cached jwks', async () => {
		const key = await makeKey('k1');
		const loadJwks = jest.fn(async () => ({keys: [key.jwk]}));
		const payload = await verifyIdToken(await sign(key.privateKey, 'k1'), loadJwks, issuer, audience);
		expect(payload.sub).toBe('user-1');
		expect(loadJwks).toHaveBeenCalledTimes(1);
		expect(loadJwks).toHaveBeenCalledWith(false);
	});

	it('should honor the supplied current date', async () => {
		const key = await makeKey('k1');
		const loadJwks = jest.fn(async () => ({keys: [key.jwk]}));
		const token = await sign(key.privateKey, 'k1');
		await expect(verifyIdToken(token, loadJwks, issuer, audience, new Date(Date.now() + 3_600_000))).rejects.toThrow();
	});

	it('should retry with a forced refresh when the key is unknown', async () => {
		const stale = await makeKey('old');
		const fresh = await makeKey('new');
		const loadJwks = jest.fn(async (force: boolean) => ({keys: [force ? fresh.jwk : stale.jwk]}));
		const payload = await verifyIdToken(await sign(fresh.privateKey, 'new'), loadJwks, issuer, audience);
		expect(payload.sub).toBe('user-1');
		expect(loadJwks.mock.calls).toEqual([[false], [true]]);
	});

	it('should throw when the key is still unknown after refresh', async () => {
		const stale = await makeKey('old');
		const other = await makeKey('new');
		const loadJwks = jest.fn(async () => ({keys: [stale.jwk]}));
		await expect(verifyIdToken(await sign(other.privateKey, 'new'), loadJwks, issuer, audience)).rejects.toThrow();
		expect(loadJwks).toHaveBeenCalledTimes(2);
	});

	it('should rethrow errors that are not missing keys without retrying', async () => {
		const key = await makeKey('k1');
		const loadJwks = jest.fn(async () => ({keys: [key.jwk]}));
		await expect(verifyIdToken(await sign(key.privateKey, 'k1'), loadJwks, 'https://other.test', audience)).rejects.toThrow();
		expect(loadJwks).toHaveBeenCalledTimes(1);
	});
});
