'use strict';

import {exportJWK, importJWK, importPKCS8} from 'jose';

import type KeyPairType from '../../types/key.pair.type';
import isRsaKey from './is.rsa.key';
import normalizePem from './normalize.pem';

const resolveKeyPair = async (signingKey: CryptoKey | string, verificationKey?: CryptoKey): Promise<KeyPairType> => {
	let privateKey: CryptoKey;
	try {
		privateKey = 'string' === typeof signingKey ? ((await importPKCS8(normalizePem(signingKey), 'RS256', {extractable: true})) as CryptoKey) : signingKey;
	} catch {
		throw new Error('signingKey is not a valid RSA private key in PEM (PKCS8 or PKCS1) form');
	}
	if (!isRsaKey(privateKey)) throw new Error('signingKey must be an RSA key usable with RS256');
	if (verificationKey) return {privateKey, publicKey: verificationKey};
	if (false === privateKey.extractable) throw new Error('signingKey is not extractable: pass verificationKey with the matching public key');

	const {kty, n, e} = await exportJWK(privateKey);
	return {privateKey, publicKey: (await importJWK({kty, n, e}, 'RS256')) as CryptoKey};
};
export default resolveKeyPair;
