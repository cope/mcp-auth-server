'use strict';

import {generateKeyPair, SignJWT} from 'jose';

import verifyAccessToken from '../../../src/functions/jwt/verify.access.token';

describe('verify.access.token tests', () => {
	const now = new Date('2026-01-01T00:00:00Z');
	const seconds = Math.floor(now.getTime() / 1000);

	const sign = (privateKey: CryptoKey, expiresAt: number, audience = 'aud'): Promise<string> =>
		new SignJWT({client_id: 'client'})
			.setProtectedHeader({alg: 'RS256'})
			.setIssuer('iss')
			.setAudience(audience)
			.setSubject('user')
			.setIssuedAt(seconds)
			.setExpirationTime(expiresAt)
			.sign(privateKey);

	it('should be defined', () => {
		expect(verifyAccessToken).toBeDefined();
		expect(typeof verifyAccessToken).toBe('function');
	});

	it('should return claims for a valid token', async () => {
		const keys = await generateKeyPair('RS256');
		const token = await sign(keys.privateKey, seconds + 60);
		const result = await verifyAccessToken(keys, token, 'iss', 'aud', now);

		expect(result).toEqual({claims: expect.objectContaining({iss: 'iss', aud: 'aud', sub: 'user', client_id: 'client'})});
	});

	it('should report an expired token', async () => {
		const keys = await generateKeyPair('RS256');
		const token = await sign(keys.privateKey, seconds + 60);

		expect(await verifyAccessToken(keys, token, 'iss', 'aud', new Date(now.getTime() + 120000))).toEqual({reason: 'expired'});
	});

	it('should reject garbage', async () => {
		const keys = await generateKeyPair('RS256');

		expect(await verifyAccessToken(keys, 'x.y.z', 'iss', 'aud', now)).toEqual({reason: 'invalid_token'});
	});

	it('should reject a wrong audience', async () => {
		const keys = await generateKeyPair('RS256');
		const token = await sign(keys.privateKey, seconds + 60, 'other');

		expect(await verifyAccessToken(keys, token, 'iss', 'aud', now)).toEqual({reason: 'invalid_token'});
	});

	it('should reject a token signed by another key', async () => {
		const keys = await generateKeyPair('RS256');
		const other = await generateKeyPair('RS256');
		const token = await sign(other.privateKey, seconds + 60);

		expect(await verifyAccessToken(keys, token, 'iss', 'aud', now)).toEqual({reason: 'invalid_token'});
	});
});
