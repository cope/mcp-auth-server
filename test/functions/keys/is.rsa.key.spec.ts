'use strict';

import {generateKeyPairSync} from 'node:crypto';

import isRsaKey from '../../../src/functions/keys/is.rsa.key';

describe('is.rsa.key tests', () => {
	it('should be defined', () => {
		expect(isRsaKey).toBeDefined();
		expect(typeof isRsaKey).toBe('function');
	});

	it('should accept a node KeyObject of type rsa', () => {
		expect(isRsaKey(generateKeyPairSync('rsa', {modulusLength: 2048}).privateKey)).toBe(true);
	});

	it('should accept a CryptoKey with the RSASSA-PKCS1-v1_5 algorithm', async () => {
		const pair = await crypto.subtle.generateKey({name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256'}, true, [
			'sign',
			'verify'
		]);
		expect(isRsaKey(pair.privateKey)).toBe(true);
	});

	it('should reject an ec KeyObject', () => {
		expect(isRsaKey(generateKeyPairSync('ec', {namedCurve: 'P-256'}).privateKey)).toBe(false);
	});

	it('should reject an RSA-PSS CryptoKey', async () => {
		const pair = await crypto.subtle.generateKey({name: 'RSA-PSS', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256'}, true, ['sign', 'verify']);
		expect(isRsaKey(pair.privateKey)).toBe(false);
	});

	it('should reject values without key metadata', () => {
		expect(isRsaKey({})).toBe(false);
		expect(isRsaKey('pem')).toBe(false);
	});
});
