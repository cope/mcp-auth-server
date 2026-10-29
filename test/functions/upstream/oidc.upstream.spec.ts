'use strict';

import {createHash} from 'node:crypto';

import {SignJWT, exportJWK, generateKeyPair} from 'jose';

import oidcUpstream from '../../../src/functions/upstream/oidc.upstream';
import type HttpRequestType from '../../../src/types/http.request.type';
import type UpstreamContextType from '../../../src/types/upstream.context.type';

const issuer = 'https://idp.test';
const clientId = 'client-1';
const discoveryUrl = `${issuer}/.well-known/openid-configuration`;
const jwksUri = `${issuer}/jwks`;
const tokenEndpoint = `${issuer}/token`;

const jsonResponse = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), {status, headers: {'content-type': 'application/json'}});

const makeKey = async (kid: string) => {
	const {publicKey, privateKey} = await generateKeyPair('RS256');
	return {privateKey, jwk: {...(await exportJWK(publicKey)), kid, alg: 'RS256', use: 'sig'}};
};

const idToken = (key: Awaited<ReturnType<typeof makeKey>>, kid: string) =>
	new SignJWT({sub: 'user-1', email: 'u@idp.test'})
		.setProtectedHeader({alg: 'RS256', kid})
		.setIssuer(issuer)
		.setAudience(clientId)
		.setIssuedAt()
		.setExpirationTime('5m')
		.sign(key.privateKey);

const request = (query: HttpRequestType['query'] = {}): HttpRequestType => ({method: 'GET', path: '/cb', query, headers: {}});
const context = (query: HttpRequestType['query'] = {}, verifier: string | null = 'verifier-1'): UpstreamContextType =>
	({
		request: request(query),
		pending: {stateId: 'state-1', upstreamCodeVerifier: verifier ?? undefined},
		issuer: 'https://mcp.test',
		callbackUrl: 'https://mcp.test/callback',
		resumeUrl: 'https://mcp.test/resume'
	}) as unknown as UpstreamContextType;

describe('oidc.upstream tests', () => {
	let key: Awaited<ReturnType<typeof makeKey>>;
	let jwks: unknown;
	let tokenBody: unknown;
	let discoveryStatus: number;
	let jwksStatus: number;
	let tokenStatus: number;
	let fetchMock: jest.Mock;

	const upstream = (options: Record<string, unknown> = {}) =>
		oidcUpstream({discoveryUrl, clientId, clientSecret: 'secret', fetch: fetchMock as unknown as typeof fetch, ...options});

	beforeAll(async () => {
		key = await makeKey('k1');
	});

	beforeEach(async () => {
		jwks = {keys: [key.jwk]};
		tokenBody = {id_token: await idToken(key, 'k1')};
		discoveryStatus = 200;
		jwksStatus = 200;
		tokenStatus = 200;
		fetchMock = jest.fn(async (url: string) => {
			if (url === discoveryUrl) {
				return jsonResponse({issuer, authorization_endpoint: `${issuer}/authorize`, token_endpoint: tokenEndpoint, jwks_uri: jwksUri}, discoveryStatus);
			}
			if (url === jwksUri) return jsonResponse(jwks, jwksStatus);
			if (url === tokenEndpoint) return jsonResponse(tokenBody, tokenStatus);
			throw new Error(`unexpected url ${url}`);
		});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('should be defined', () => {
		expect(oidcUpstream).toBeDefined();
		expect(typeof oidcUpstream).toBe('function');
	});

	it('should begin with an authorization url using PKCE S256 and the default scope', async () => {
		const result = await upstream().begin(context());
		expect(result.type).toBe('redirect');
		const url = new URL((result as {url: string}).url);
		expect(url.origin + url.pathname).toBe(`${issuer}/authorize`);
		expect(url.searchParams.get('client_id')).toBe(clientId);
		expect(url.searchParams.get('response_type')).toBe('code');
		expect(url.searchParams.get('redirect_uri')).toBe('https://mcp.test/callback');
		expect(url.searchParams.get('scope')).toBe('openid profile email');
		expect(url.searchParams.get('state')).toBe('state-1');
		expect(url.searchParams.get('code_challenge')).toBe(createHash('sha256').update('verifier-1').digest('base64url'));
		expect(url.searchParams.get('code_challenge_method')).toBe('S256');
	});

	it('should begin with a custom scope', async () => {
		const result = await upstream({scope: 'openid offline_access'}).begin(context());
		expect(new URL((result as {url: string}).url).searchParams.get('scope')).toBe('openid offline_access');
	});

	it('should fall back to an empty verifier when none is stored', async () => {
		const result = await upstream().begin(context({}, null));
		expect(new URL((result as {url: string}).url).searchParams.get('code_challenge')).toBe(createHash('sha256').update('').digest('base64url'));
	});

	it('should complete the callback and return the verified claims', async () => {
		const claims = await upstream().callback!(context({code: 'abc'}));
		expect(claims).toMatchObject({sub: 'user-1', email: 'u@idp.test', iss: issuer});
		const tokenCall = fetchMock.mock.calls.find(([url]) => url === tokenEndpoint)!;
		expect(tokenCall[1].method).toBe('POST');
		const body = new URLSearchParams(tokenCall[1].body);
		expect(body.get('grant_type')).toBe('authorization_code');
		expect(body.get('code')).toBe('abc');
		expect(body.get('client_secret')).toBe('secret');
		expect(body.get('code_verifier')).toBe('verifier-1');
	});

	it('should send an empty code verifier when none is stored', async () => {
		await upstream().callback!(context({code: 'abc'}, null));
		const tokenCall = fetchMock.mock.calls.find(([url]) => url === tokenEndpoint)!;
		expect(new URLSearchParams(tokenCall[1].body).get('code_verifier')).toBe('');
	});

	it('should return null when the idp reports an error', async () => {
		expect(await upstream().callback!(context({code: 'abc', error: 'access_denied'}))).toBeNull();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('should return null when the code is missing', async () => {
		expect(await upstream().callback!(context({}))).toBeNull();
		expect(await upstream().callback!(context({code: ['a', 'b']}))).toBeNull();
	});

	it('should return null when the token endpoint is not ok', async () => {
		tokenStatus = 400;
		expect(await upstream().callback!(context({code: 'abc'}))).toBeNull();
	});

	it('should return null when the id_token is missing', async () => {
		tokenBody = {access_token: 'x'};
		expect(await upstream().callback!(context({code: 'abc'}))).toBeNull();
	});

	it('should retry discovery after a failure', async () => {
		const instance = upstream();
		discoveryStatus = 500;
		await expect(instance.begin(context())).rejects.toThrow('OIDC discovery failed with status 500');
		discoveryStatus = 200;
		expect((await instance.begin(context())).type).toBe('redirect');
	});

	it('should cache discovery between calls', async () => {
		const instance = upstream();
		await instance.begin(context());
		await instance.begin(context());
		expect(fetchMock.mock.calls.filter(([url]) => url === discoveryUrl)).toHaveLength(1);
	});

	it('should throw when the jwks fetch is not ok and retry afterwards', async () => {
		const instance = upstream();
		jwksStatus = 503;
		await expect(instance.callback!(context({code: 'abc'}))).rejects.toThrow('OIDC jwks fetch failed with status 503');
		jwksStatus = 200;
		expect(await instance.callback!(context({code: 'abc'}))).toMatchObject({sub: 'user-1'});
	});

	it('should refetch jwks on key rotation', async () => {
		const rotated = await makeKey('k2');
		const instance = upstream();
		await instance.callback!(context({code: 'abc'}));
		jwks = {keys: [rotated.jwk]};
		tokenBody = {id_token: await idToken(rotated, 'k2')};
		expect(await instance.callback!(context({code: 'abc'}))).toMatchObject({sub: 'user-1'});
		expect(fetchMock.mock.calls.filter(([url]) => url === jwksUri)).toHaveLength(2);
	});

	it('should throw when the signing key stays unknown after a refetch', async () => {
		const rogue = await makeKey('rogue');
		tokenBody = {id_token: await idToken(rogue, 'rogue')};
		await expect(upstream().callback!(context({code: 'abc'}))).rejects.toThrow();
	});

	it('should use options.now when verifying', async () => {
		const now = jest.fn(() => new Date(Date.now() + 3_600_000));
		await expect(upstream({now}).callback!(context({code: 'abc'}))).rejects.toThrow();
		expect(now).toHaveBeenCalled();
	});

	it('should fall back to the global fetch', async () => {
		const spy = jest.spyOn(globalThis, 'fetch').mockImplementation(fetchMock as unknown as typeof fetch);
		const result = await oidcUpstream({discoveryUrl, clientId, clientSecret: 'secret'}).begin(context());
		expect(result.type).toBe('redirect');
		expect(spy).toHaveBeenCalledWith(discoveryUrl, undefined);
	});
});
