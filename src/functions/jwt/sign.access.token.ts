'use strict';

import {SignJWT} from 'jose';

import type AccessTokenInputType from '../../types/access.token.input.type';
import type KeyPairType from '../../types/key.pair.type';
import randomId from '../crypto/random.id';

const signAccessToken = async (keys: KeyPairType, input: AccessTokenInputType): Promise<string> => {
	const issuedAt: number = Math.floor(input.now.getTime() / 1000);
	return new SignJWT({client_id: input.clientId})
		.setProtectedHeader({alg: 'RS256'})
		.setIssuer(input.issuer)
		.setAudience(input.resource)
		.setSubject(input.userId)
		.setJti(randomId())
		.setIssuedAt(issuedAt)
		.setExpirationTime(issuedAt + input.ttlSeconds)
		.sign(keys.privateKey);
};
export default signAccessToken;
