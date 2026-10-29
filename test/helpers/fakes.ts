'use strict';

import {SignJWT, exportJWK, generateKeyPair} from 'jose';

export const idpIssuer = 'https://idp.test';
export const idpClientId = 'idp-client';

export const createFakeOidc = async (claims: Record<string, unknown> = {sub: 'oidc-user-1', name: 'Ada Lovelace', email: 'ada@example.test'}) => {
	const {privateKey, publicKey} = await generateKeyPair('RS256', {extractable: true});
	const jwk = {...(await exportJWK(publicKey)), kid: 'idp-key', alg: 'RS256', use: 'sig'};
	const requests: {url: string; body?: string}[] = [];
	let tokenStatus = 200;

	const fetchImpl = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
		const url = String(input instanceof Request ? input.url : input);
		requests.push({url, body: 'string' === typeof init?.body ? init.body : undefined});
		if (url === `${idpIssuer}/.well-known/openid-configuration`) {
			return Response.json({issuer: idpIssuer, authorization_endpoint: `${idpIssuer}/authorize`, token_endpoint: `${idpIssuer}/token`, jwks_uri: `${idpIssuer}/jwks`});
		}
		if (url === `${idpIssuer}/jwks`) return Response.json({keys: [jwk]});
		if (url === `${idpIssuer}/token`) {
			if (200 !== tokenStatus) return new Response('{}', {status: tokenStatus});
			const idToken = await new SignJWT(claims)
				.setProtectedHeader({alg: 'RS256', kid: 'idp-key'})
				.setIssuer(idpIssuer)
				.setAudience(idpClientId)
				.setIssuedAt()
				.setExpirationTime('5m')
				.sign(privateKey);
			return Response.json({id_token: idToken, access_token: 'unused'});
		}
		return new Response('not found', {status: 404});
	};

	return {
		fetch: fetchImpl as typeof fetch,
		requests,
		failTokenEndpoint: (status = 400): void => {
			tokenStatus = status;
		}
	};
};

export type FakeOidc = Awaited<ReturnType<typeof createFakeOidc>>;
