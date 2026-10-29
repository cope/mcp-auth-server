'use strict';

import {generateKeyPairSync} from 'node:crypto';

import {generateKeyPair} from 'jose';

import resolveKeyPair from '../../../src/functions/keys/resolve.key.pair';

describe('resolve.key.pair tests', () => {
	const rsa = generateKeyPairSync('rsa', {modulusLength: 2048});
	const pkcs8 = rsa.privateKey.export({type: 'pkcs8', format: 'pem'}) as string;
	const pkcs1 = rsa.privateKey.export({type: 'pkcs1', format: 'pem'}) as string;

	it('should be defined', () => {
		expect(resolveKeyPair).toBeDefined();
		expect(typeof resolveKeyPair).toBe('function');
	});

	it('should resolve a pkcs8 pem string and derive the public key', async () => {
		const pair = await resolveKeyPair(pkcs8);

		expect(pair.privateKey.type).toBe('private');
		expect(pair.publicKey.type).toBe('public');
	});

	it('should resolve a pkcs1 pem string', async () => {
		const pair = await resolveKeyPair(pkcs1);

		expect(pair.privateKey.type).toBe('private');
		expect(pair.publicKey.type).toBe('public');
	});

	it('should reject an invalid pem string', async () => {
		await expect(resolveKeyPair('not a pem')).rejects.toThrow('signingKey is not a valid RSA private key in PEM (PKCS8 or PKCS1) form');
	});

	it('should reject a non rsa key', async () => {
		const {privateKey} = await generateKeyPair('ES256', {extractable: true});

		await expect(resolveKeyPair(privateKey)).rejects.toThrow('signingKey must be an RSA key usable with RS256');
	});

	it('should resolve an extractable CryptoKey', async () => {
		const {privateKey} = await generateKeyPair('RS256', {extractable: true});
		const pair = await resolveKeyPair(privateKey);

		expect(pair.privateKey).toBe(privateKey);
		expect(pair.publicKey.type).toBe('public');
	});

	it('should pass through the verification key', async () => {
		const {privateKey, publicKey} = await generateKeyPair('RS256');

		expect(await resolveKeyPair(privateKey, publicKey)).toEqual({privateKey, publicKey});
	});

	it('should reject a non extractable key without a verification key', async () => {
		const {privateKey} = (await crypto.subtle.generateKey({name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256'}, false, [
			'sign',
			'verify'
		])) as CryptoKeyPair;

		await expect(resolveKeyPair(privateKey)).rejects.toThrow('signingKey is not extractable: pass verificationKey with the matching public key');
	});
});
