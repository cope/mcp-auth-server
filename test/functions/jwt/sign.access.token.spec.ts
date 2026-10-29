'use strict';

import {decodeJwt, decodeProtectedHeader, generateKeyPair, jwtVerify} from 'jose';

import randomId from '../../../src/functions/crypto/random.id';
import signAccessToken from '../../../src/functions/jwt/sign.access.token';

jest.mock('../../../src/functions/crypto/random.id');

const mockRandomId = randomId as jest.MockedFunction<typeof randomId>;

describe('sign.access.token tests', () => {
	const now = new Date('2026-01-01T00:00:00.900Z');
	const issuedAt = Math.floor(now.getTime() / 1000);
	const input = {issuer: 'https://issuer', resource: 'https://resource', userId: 'user-1', clientId: 'client-1', ttlSeconds: 300, now};

	beforeEach(() => {
		mockRandomId.mockReturnValue('jti-1');
	});

	it('should be defined', () => {
		expect(signAccessToken).toBeDefined();
		expect(typeof signAccessToken).toBe('function');
	});

	it('should sign an RS256 token with the expected claims', async () => {
		const keys = await generateKeyPair('RS256');
		const token = await signAccessToken(keys, input);

		expect(decodeProtectedHeader(token)).toEqual({alg: 'RS256'});
		expect(decodeJwt(token)).toEqual({client_id: 'client-1', iss: 'https://issuer', aud: 'https://resource', sub: 'user-1', jti: 'jti-1', iat: issuedAt, exp: issuedAt + 300});
	});

	it('should produce a token verifiable with the public key', async () => {
		const keys = await generateKeyPair('RS256');
		const token = await signAccessToken(keys, input);
		const {payload} = await jwtVerify(token, keys.publicKey, {currentDate: now});

		expect(payload.sub).toBe('user-1');
		expect(mockRandomId).toHaveBeenCalledTimes(1);
	});
});
