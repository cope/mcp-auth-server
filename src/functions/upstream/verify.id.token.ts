'use strict';

import {JWTPayload, createLocalJWKSet, errors, jwtVerify} from 'jose';

const verifyIdToken = async (token: string, loadJwks: (force: boolean) => Promise<any>, issuer: string, audience: string, now?: Date): Promise<JWTPayload> => {
	const options = {issuer, audience, currentDate: now};
	try {
		return (await jwtVerify(token, createLocalJWKSet(await loadJwks(false)), options)).payload;
	} catch (error) {
		if (!(error instanceof errors.JWKSNoMatchingKey)) throw error;
		return (await jwtVerify(token, createLocalJWKSet(await loadJwks(true)), options)).payload;
	}
};
export default verifyIdToken;
