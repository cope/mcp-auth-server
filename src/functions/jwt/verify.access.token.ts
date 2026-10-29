'use strict';

import {errors, jwtVerify} from 'jose';

import type KeyPairType from '../../types/key.pair.type';
import type VerifyResultType from '../../types/verify.result.type';

const verifyAccessToken = async (keys: KeyPairType, token: string, issuer: string, resource: string, now: Date): Promise<VerifyResultType> => {
	try {
		const {payload} = await jwtVerify(token, keys.publicKey, {algorithms: ['RS256'], issuer, audience: resource, currentDate: now});
		return {claims: payload as Record<string, unknown>};
	} catch (error) {
		if (error instanceof errors.JWTExpired) return {reason: 'expired'};
		return {reason: 'invalid_token'};
	}
};
export default verifyAccessToken;
