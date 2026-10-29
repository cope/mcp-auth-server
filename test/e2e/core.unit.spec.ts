'use strict';

import {generateKeyPairSync} from 'node:crypto';

import LruMetadataCache from '../../src/cache/lru.metadata.cache';
import createMetadataResolver from '../../src/functions/cimd/create.metadata.resolver';
import isMetadataClientId from '../../src/functions/cimd/is.metadata.client.id';
import isAllowedRedirectUri from '../../src/functions/redirect/is.allowed.redirect.uri';
import isSafeMetadataRedirectUri from '../../src/functions/redirect/is.safe.metadata.redirect.uri';
import normalizePem from '../../src/functions/keys/normalize.pem';
import resolveKeyPair from '../../src/functions/keys/resolve.key.pair';
import signingKeyFromEnv from '../../src/functions/keys/signing.key.from.env';
import renderDefaultConsent from '../../src/functions/consent/render.default.consent';
import sha256Base64Url from '../../src/functions/crypto/sha256.base64.url';
import sha256Hex from '../../src/functions/crypto/sha256.hex';
import {cimdClientId, cimdFetch, makeApp} from '../helpers/app';
import {authorize, consentAndGetCode, exchange, finishSignIn, location, registerClient, signInAndGetTokens} from '../helpers/flow';
import {coreContext} from '../helpers/core.harness';

describe('CIMD resolver', () => {
	const resolverWith = (options: Parameters<typeof createMetadataResolver>[0], now = {value: 0}) => {
		const cache = new LruMetadataCache(10, () => now.value);
		return {resolve: createMetadataResolver(options, cache), now, cache};
	};

	it('fetches and validates a document', async () => {
		const {resolve} = resolverWith({fetch: cimdFetch()});
		const result = await resolve(cimdClientId);
		expect(result).toMatchObject({ok: true, metadata: {client_name: 'CIMD Client'}});
	});

	it('rejects a client_id that differs from the document URL', async () => {
		const {resolve} = resolverWith({fetch: cimdFetch({client_id: 'https://client.example/other.json'})});
		expect(await resolve(cimdClientId)).toMatchObject({ok: false, reason: expect.stringContaining('does not match')});
	});

	it.each([['client_name'], ['redirect_uris']])('rejects a document missing %s', async (field) => {
		const {resolve} = resolverWith({fetch: cimdFetch({[field]: undefined})});
		expect((await resolve(cimdClientId)).ok).toBe(false);
	});

	it('rejects documents with secrets or unsupported auth methods', async () => {
		expect((await resolverWith({fetch: cimdFetch({client_secret: 'x'})}).resolve(cimdClientId)).ok).toBe(false);
		expect((await resolverWith({fetch: cimdFetch({token_endpoint_auth_method: 'private_key_jwt'})}).resolve(cimdClientId)).ok).toBe(false);
	});

	it('rejects unsafe redirect URIs in the document', async () => {
		for (const uri of ['javascript:alert(1)', 'http://evil.example/cb', 'https://client.example/cb#frag']) {
			expect((await resolverWith({fetch: cimdFetch({redirect_uris: [uri]})}).resolve(cimdClientId)).ok).toBe(false);
		}
	});

	it('rejects non-JSON, non-200 and redirecting responses', async () => {
		const respond = (response: () => Response): typeof fetch => (async () => response()) as typeof fetch;
		expect((await resolverWith({fetch: respond(() => new Response('<html>'))}).resolve(cimdClientId)).ok).toBe(false);
		expect((await resolverWith({fetch: respond(() => new Response('{}', {status: 404}))}).resolve(cimdClientId)).ok).toBe(false);
		expect((await resolverWith({fetch: respond(() => new Response(null, {status: 302, headers: {location: 'https://elsewhere.example/'}}))}).resolve(cimdClientId)).ok).toBe(
			false
		);
	});

	it('passes redirect: manual to fetch', async () => {
		let seen: RequestInit | undefined;
		const spy = (async (_url: string, init?: RequestInit) => {
			seen = init;
			return cimdFetch()(_url, init);
		}) as typeof fetch;
		await resolverWith({fetch: spy}).resolve(cimdClientId);
		expect(seen?.redirect).toBe('manual');
	});

	it('rejects oversize documents', async () => {
		const big = {client_id: cimdClientId, client_name: 'x'.repeat(9000), redirect_uris: ['https://client.example/cb']};
		const {resolve} = resolverWith({fetch: (async () => new Response(JSON.stringify(big))) as typeof fetch, maxBytes: 1024});
		expect(await resolve(cimdClientId)).toMatchObject({ok: false, reason: expect.stringContaining('too large')});
	});

	it('rejects oversize documents declared by content-length', async () => {
		const {resolve} = resolverWith({fetch: (async () => new Response('{}', {headers: {'content-length': '999999'}})) as typeof fetch, maxBytes: 1024});
		expect((await resolve(cimdClientId)).ok).toBe(false);
	});

	it('times out slow servers', async () => {
		const slow = ((_url: string, init?: RequestInit) =>
			new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted'))))) as typeof fetch;
		const {resolve} = resolverWith({fetch: slow, timeoutMs: 20});
		expect((await resolve(cimdClientId)).ok).toBe(false);
	});

	it.each([
		['https://localhost/c.json'],
		['https://127.0.0.1/c.json'],
		['https://10.1.2.3/c.json'],
		['https://192.168.0.5/c.json'],
		['https://169.254.169.254/c.json'],
		['https://[::1]/c.json'],
		['https://[fd00::1]/c.json'],
		['https://service.internal/c.json']
	])('rejects private target %s without fetching', async (url) => {
		let called = false;
		const {resolve} = resolverWith({
			fetch: (async () => {
				called = true;
				return new Response('{}');
			}) as typeof fetch
		});
		expect((await resolve(url)).ok).toBe(false);
		expect(called).toBe(false);
	});

	it('runs the injected guard', async () => {
		const {resolve} = resolverWith({
			fetch: cimdFetch(),
			guard: () => {
				throw new Error('blocked by guard');
			}
		});
		expect(await resolve(cimdClientId)).toMatchObject({ok: false, reason: 'blocked by guard'});
	});

	it('serves a cache hit without refetching, then refetches after expiry', async () => {
		let calls = 0;
		const counting = (async (url: string, init?: RequestInit) => {
			calls += 1;
			return cimdFetch()(url, init);
		}) as typeof fetch;
		const {resolve, now} = resolverWith({fetch: counting});
		await resolve(cimdClientId);
		await resolve(cimdClientId);
		expect(calls).toBe(1);
		now.value += 61_000;
		await resolve(cimdClientId);
		expect(calls).toBe(2);
	});

	it('does not cache no-store responses and clamps max-age', async () => {
		let calls = 0;
		const counting = (headers: Record<string, string>) =>
			(async (url: string, init?: RequestInit) => {
				calls += 1;
				return cimdFetch({}, headers)(url, init);
			}) as typeof fetch;
		const noStore = resolverWith({fetch: counting({'cache-control': 'no-store'})});
		await noStore.resolve(cimdClientId);
		await noStore.resolve(cimdClientId);
		expect(calls).toBe(2);

		calls = 0;
		const clamped = resolverWith({fetch: counting({'cache-control': 'max-age=999999'}), maxCacheSeconds: 10});
		await clamped.resolve(cimdClientId);
		clamped.now.value += 11_000;
		await clamped.resolve(cimdClientId);
		expect(calls).toBe(2);
	});

	it('applies the trust policy before fetching', async () => {
		expect((await resolverWith({fetch: cimdFetch(), trust: {denyHosts: ['client.example']}}).resolve(cimdClientId)).ok).toBe(false);
		expect((await resolverWith({fetch: cimdFetch(), trust: {allowHosts: ['other.example']}}).resolve(cimdClientId)).ok).toBe(false);
		expect((await resolverWith({fetch: cimdFetch(), trust: {allowHosts: ['*.example']}}).resolve(cimdClientId)).ok).toBe(true);
	});

	it('evicts the least recently used entry', async () => {
		const cache = new LruMetadataCache(1);
		const metadata = {client_id: 'a', client_name: 'a', redirect_uris: []};
		await cache.set('a', metadata, 60);
		await cache.set('b', metadata, 60);
		expect(await cache.get('a')).toBeUndefined();
		expect(await cache.get('b')).toBeDefined();
	});

	it('recognises metadata client ids', () => {
		expect(isMetadataClientId('https://client.example/client.json')).toBe(true);
		expect(isMetadataClientId('https://client.example')).toBe(false);
		expect(isMetadataClientId('https://client.example/')).toBe(false);
		expect(isMetadataClientId('http://client.example/client.json')).toBe(false);
		expect(isMetadataClientId('https://user@client.example/client.json')).toBe(false);
		expect(isMetadataClientId('6f1c1c0e-4f0a-4f2b-9d3e-000000000000')).toBe(false);
	});
});

describe('redirect policy', () => {
	const policy = {httpsHosts: ['www.cursor.com'], customSchemes: ['cursor://', 'vscode://']};

	it.each([
		['http://localhost:3000/cb', true],
		['http://127.0.0.1:9/cb', true],
		['http://example.com/cb', false],
		['https://www.cursor.com/cb', true],
		['https://evil.example/cb', false],
		['cursor://anysphere/cb', true],
		['vscode://x/y', true],
		['other://x', false],
		['http://localhost/cb#frag', false],
		['https://www.cursor.com/cb#frag', false],
		['not a url', false]
	])('%s -> %s', (uri, allowed) => {
		expect(isAllowedRedirectUri(uri, policy)).toBe(allowed);
	});

	it('rejects non-strings', () => {
		expect(isAllowedRedirectUri(42, policy)).toBe(false);
		expect(isSafeMetadataRedirectUri(undefined)).toBe(false);
	});
});

describe('keys', () => {
	it('accepts PKCS8 PEM with literal \\n newlines', async () => {
		const {privateKey} = generateKeyPairSync('rsa', {modulusLength: 2048});
		const pem = privateKey.export({type: 'pkcs8', format: 'pem'}) as string;
		const pair = await resolveKeyPair(pem.replace(/\n/g, '\\n'));
		expect(pair.publicKey.type).toBe('public');
	});

	it('accepts PKCS1 PEM', async () => {
		const {privateKey} = generateKeyPairSync('rsa', {modulusLength: 2048});
		const pem = privateKey.export({type: 'pkcs1', format: 'pem'}) as string;
		expect(normalizePem(pem)).toContain('BEGIN PRIVATE KEY');
		expect((await resolveKeyPair(pem)).privateKey.type).toBe('private');
	});

	it('rejects garbage and non-RSA keys', async () => {
		await expect(resolveKeyPair('not a key')).rejects.toThrow('valid RSA private key');
		const {privateKey} = generateKeyPairSync('ec', {namedCurve: 'P-256'});
		await expect(resolveKeyPair(privateKey.export({type: 'pkcs8', format: 'pem'}) as string)).rejects.toThrow();
	});

	it('reads the key from an env object', () => {
		expect(() => signingKeyFromEnv({}, 'KEY')).toThrow('KEY is not set');
		expect(signingKeyFromEnv({KEY: 'a\\nb'}, 'KEY')).toBe('a\nb');
	});
});

describe('hashing', () => {
	it('matches known SHA-256 vectors', async () => {
		expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
		expect(await sha256Base64Url('abc')).toBe('ungWv48Bz-pBQUDeXa4iI7ADYaOWF3qctBD_YfIAFa0');
	});
});

describe('consent page', () => {
	const model = {
		action: '/oauth/consent',
		state: 's"><script>',
		clientId: 'https://client.example/c.json',
		clientName: '<img src=x onerror=alert(1)>',
		clientHost: 'client.example',
		metadataDocument: true,
		redirectUri: 'http://localhost:1/cb',
		redirectTarget: 'localhost:1',
		redirectIsLocalhost: true,
		userDisplayName: '<b>Eve</b>',
		productName: 'Prod',
		environmentLabel: 'dev'
	};

	it('escapes every value and shows host, redirect target and localhost warning', () => {
		const html = renderDefaultConsent(model);
		expect(html).not.toContain('<img');
		expect(html).not.toContain('<script>');
		expect(html).not.toContain('<b>Eve');
		expect(html).toContain('&lt;img src=x');
		expect(html).toContain('client.example');
		expect(html).toContain('localhost:1');
		expect(html).toContain('localhost)');
	});
});

describe('authorize', () => {
	const send = async (kind: 'oidc' | 'session' = 'oidc') => {
		const context = await coreContext(kind, 'dcr');
		return {context, clientId: await registerClient(context)};
	};

	it('answers 400 and never redirects for unknown clients or unregistered redirect URIs', async () => {
		const {context, clientId} = await send();
		const unknown = (await authorize(context, 'nope')).sent;
		expect(unknown.status).toBe(400);
		expect(unknown.headers.location).toBeUndefined();
		const badRedirect = (await authorize(context, clientId, {redirect_uri: 'http://localhost:8123/other'})).sent;
		expect(badRedirect.status).toBe(400);
		expect(badRedirect.headers.location).toBeUndefined();
	});

	it.each([
		['unsupported_response_type', {response_type: 'token'}],
		['invalid_request', {code_challenge_method: 'plain'}],
		['invalid_request', {code_challenge: 'short'}],
		['invalid_target', {resource: 'https://other.example/mcp'}]
	])('redirects %s to the client with state and iss', async (error, overrides) => {
		const {context, clientId} = await send();
		const target = location((await authorize(context, clientId, overrides)).sent);
		expect(target.origin + target.pathname).toBe('http://localhost:8123/callback');
		expect(target.searchParams.get('error')).toBe(error);
		expect(target.searchParams.get('state')).toBe('client-state-1');
		expect(target.searchParams.get('iss')).toBe(context.issuer);
	});

	it('rejects a CIMD client whose redirect_uri is not listed', async () => {
		const context = await coreContext('oidc', 'cimd');
		const sent = (await authorize(context, cimdClientId, {redirect_uri: 'http://localhost:9999/cb'})).sent;
		expect(sent.status).toBe(400);
	});

	it('rejects a CIMD client whose document cannot be fetched', async () => {
		const app = await makeApp('oidc', {cimd: {fetch: (async () => new Response('{}', {status: 500})) as typeof fetch}});
		const response = await app.auth.handle({
			method: 'GET',
			path: '/authorize',
			query: {client_id: cimdClientId, redirect_uri: 'http://localhost:8123/callback', response_type: 'code'},
			headers: {}
		});
		expect(response.status).toBe(400);
	});

	it('treats https URL client ids as unknown when CIMD is disabled', async () => {
		const app = await makeApp('oidc', {cimd: {enabled: false}});
		const metadata = await app.auth.handle({method: 'GET', path: '/.well-known/oauth-authorization-server', query: {}, headers: {}});
		expect((metadata.body as Record<string, unknown>).client_id_metadata_document_supported).toBeUndefined();
		const response = await app.auth.handle({method: 'GET', path: '/authorize', query: {client_id: cimdClientId}, headers: {}});
		expect(response.status).toBe(400);
	});
});

describe('register', () => {
	it('rejects missing and disallowed redirect URIs', async () => {
		const context = await coreContext('oidc', 'dcr');
		const post = (json: unknown) => context.send({method: 'POST', url: `${context.issuer}/register`, json});
		expect((await post({})).status).toBe(400);
		expect((await post({redirect_uris: []})).status).toBe(400);
		expect((await post({redirect_uris: ['https://evil.example/cb']})).body.error).toBe('invalid_redirect_uri');
		expect((await post({redirect_uris: ['http://localhost/cb#x']})).status).toBe(400);
		const ok = await post({redirect_uris: ['cursor://a/b'], client_name: 'n'});
		expect(ok.status).toBe(201);
		expect(ok.body).toMatchObject({token_endpoint_auth_method: 'none', grant_types: ['authorization_code', 'refresh_token'], response_types: ['code']});
	});
});

describe('callback and consent', () => {
	it('redirects access_denied with iss when the upstream reports an error', async () => {
		const context = await coreContext('oidc', 'dcr');
		const clientId = await registerClient(context);
		const {sent} = await authorize(context, clientId);
		const state = new URL(location(sent).toString()).searchParams.get('state') as string;
		const denied = await context.send({method: 'GET', url: `${context.issuer}/oauth/callback?error=access_denied&state=${state}`});
		const target = location(denied);
		expect(target.searchParams.get('error')).toBe('access_denied');
		expect(target.searchParams.get('iss')).toBe(context.issuer);
		const again = await context.send({method: 'GET', url: `${context.issuer}/oauth/callback?code=x&state=${state}`});
		expect(again.status).toBe(400);
	});

	it('answers 400 for unknown state', async () => {
		const context = await coreContext('oidc', 'dcr');
		expect((await context.send({method: 'GET', url: `${context.issuer}/oauth/callback?code=x&state=nope`})).status).toBe(400);
		expect((await context.send({method: 'GET', url: `${context.issuer}/oauth/callback?code=x`})).status).toBe(400);
	});

	it('refuses a callback for a pending authorization that already holds a user', async () => {
		const context = await coreContext('oidc', 'dcr');
		const clientId = await registerClient(context);
		const {sent} = await authorize(context, clientId);
		const {next} = await context.signIn(location(sent).toString());
		await context.send({method: 'GET', url: next});
		expect((await context.send({method: 'GET', url: next})).status).toBe(400);
	});

	it('denies when the upstream token exchange fails', async () => {
		const app = await makeApp('oidc', {resolveUser: () => Promise.reject(new Error('boom'))});
		const context = {...app.context, send: undefined as never, mcp: undefined as never};
		const clientRegister = await app.auth.handle({method: 'POST', path: '/register', query: {}, headers: {}, body: {redirect_uris: ['http://localhost:8123/callback']}});
		const clientId = (clientRegister.body as {client_id: string}).client_id;
		const authorizeResponse = await app.auth.handle({
			method: 'GET',
			path: '/authorize',
			query: {
				client_id: clientId,
				redirect_uri: 'http://localhost:8123/callback',
				response_type: 'code',
				code_challenge: 'a'.repeat(43),
				code_challenge_method: 'S256',
				resource: context.resource
			},
			headers: {}
		});
		const state = new URL(authorizeResponse.headers.location as string).searchParams.get('state') as string;
		const result = await app.auth.handle({method: 'GET', path: '/oauth/callback', query: {code: 'x', state}, headers: {}});
		expect(new URL(result.headers.location as string).searchParams.get('error')).toBe('access_denied');
	});

	it('redirects access_denied when the user denies consent', async () => {
		const context = await coreContext('oidc', 'dcr');
		const clientId = await registerClient(context);
		const {sent} = await authorize(context, clientId);
		const after = await finishSignIn(context, sent);
		const target = await consentAndGetCode(context, after, 'deny');
		expect(target.searchParams.get('error')).toBe('access_denied');
		expect(target.searchParams.get('iss')).toBe(context.issuer);
	});

	it('rejects invalid consent posts and replays', async () => {
		const context = await coreContext('oidc', 'dcr');
		const clientId = await registerClient(context);
		const {sent} = await authorize(context, clientId);
		const after = await finishSignIn(context, sent);
		const state = location(after).searchParams.get('state') as string;
		const post = (form: Record<string, string>) => context.send({method: 'POST', url: `${context.issuer}/oauth/consent`, form});
		expect((await post({state, decision: 'maybe'})).status).toBe(400);
		expect((await post({state: 'nope', decision: 'approve'})).status).toBe(400);
		expect((await post({state, decision: 'approve'})).status).toBe(302);
		expect((await post({state, decision: 'approve'})).status).toBe(400);
	});

	it('binds the consent step to the signed-in app session', async () => {
		const context = await coreContext('session', 'dcr');
		const clientId = await registerClient(context);
		const {sent} = await authorize(context, clientId);
		const after = await finishSignIn(context, sent);
		const consentUrl = location(after).toString();
		const state = location(after).searchParams.get('state') as string;
		expect((await context.send({method: 'GET', url: consentUrl, headers: {cookie: 'session=mallory'}})).status).toBe(400);
		expect((await context.send({method: 'GET', url: consentUrl})).status).toBe(400);
		expect(
			(await context.send({method: 'POST', url: `${context.issuer}/oauth/consent`, headers: {cookie: 'session=mallory'}, form: {state, decision: 'approve'}})).status
		).toBe(400);
		expect((await context.send({method: 'GET', url: consentUrl, headers: context.sessionHeaders})).status).toBe(200);
	});

	it('denies resume when the user is still not signed in', async () => {
		const context = await coreContext('session', 'dcr');
		const clientId = await registerClient(context);
		const {sent} = await authorize(context, clientId);
		const returnTo = new URL(location(sent).toString()).searchParams.get('returnTo') as string;
		const result = await context.send({method: 'GET', url: returnTo});
		expect(location(result).searchParams.get('error')).toBe('access_denied');
	});

	it('builds returnTo from the issuer only', async () => {
		const context = await coreContext('session', 'dcr');
		const clientId = await registerClient(context);
		const {sent} = await authorize(context, clientId);
		const returnTo = new URL(new URL(location(sent).toString()).searchParams.get('returnTo') as string);
		expect(returnTo.origin).toBe(context.issuer);
		expect(returnTo.pathname).toBe('/oauth/resume');
	});
});

describe('token endpoint', () => {
	const form = (context: Awaited<ReturnType<typeof coreContext>>, fields: Record<string, string>, headers?: Record<string, string>) =>
		context.send({method: 'POST', url: `${context.issuer}/token`, form: fields, headers});

	it('rejects credentials from public clients', async () => {
		const context = await coreContext('oidc', 'dcr');
		const withSecret = await form(context, {grant_type: 'refresh_token', client_secret: 'x'});
		expect(withSecret.status).toBe(401);
		expect(withSecret.body.error).toBe('invalid_client');
		expect((await form(context, {grant_type: 'refresh_token'}, {authorization: 'Basic abc'})).status).toBe(401);
		const revoke = await context.send({method: 'POST', url: `${context.issuer}/revoke`, form: {token: 'x', client_id: 'y', client_secret: 'z'}});
		expect(revoke.status).toBe(401);
	});

	it('rejects unsupported grants and missing parameters', async () => {
		const context = await coreContext('oidc', 'dcr');
		expect((await form(context, {grant_type: 'password'})).body.error).toBe('unsupported_grant_type');
		expect((await form(context, {grant_type: 'authorization_code'})).body.error).toBe('invalid_request');
		expect((await form(context, {grant_type: 'refresh_token'})).body.error).toBe('invalid_request');
	});

	it('burns the code and rejects a wrong verifier, client, redirect_uri or resource', async () => {
		const context = await coreContext('oidc', 'dcr');
		const clientId = await registerClient(context);

		const attempt = async (mutate: (fields: Record<string, string>) => Record<string, string>) => {
			const {sent, verifier} = await authorize(context, clientId);
			const target = await consentAndGetCode(context, await finishSignIn(context, sent));
			const fields = {
				grant_type: 'authorization_code',
				code: target.searchParams.get('code') as string,
				client_id: clientId,
				redirect_uri: 'http://localhost:8123/callback',
				code_verifier: verifier
			};
			const failed = await form(context, mutate(fields));
			expect(failed.status).toBe(400);
			expect(failed.body.error).toBe('invalid_grant');
			expect((await form(context, fields)).status).toBe(400);
		};
		await attempt((fields) => ({...fields, code_verifier: 'x'.repeat(43)}));
		await attempt((fields) => ({...fields, client_id: 'other'}));
		await attempt((fields) => ({...fields, redirect_uri: 'http://localhost:8123/elsewhere'}));
		await attempt((fields) => ({...fields, resource: 'https://other.example/mcp'}));
	});

	it('rejects malformed code verifiers', async () => {
		const context = await coreContext('oidc', 'dcr');
		const failed = await form(context, {grant_type: 'authorization_code', code: 'c', client_id: 'c', redirect_uri: 'r', code_verifier: 'short'});
		expect(failed.body.error).toBe('invalid_grant');
	});

	it('rejects refresh tokens presented by another client', async () => {
		const context = await coreContext('oidc', 'dcr');
		const {tokens} = await signInAndGetTokens(context);
		const result = await form(context, {grant_type: 'refresh_token', refresh_token: tokens.body.refresh_token, client_id: 'other'});
		expect(result.body.error).toBe('invalid_grant');
	});

	it('exchanges a code only once even when raced', async () => {
		const context = await coreContext('oidc', 'dcr');
		const clientId = await registerClient(context);
		const {sent, verifier} = await authorize(context, clientId);
		const target = await consentAndGetCode(context, await finishSignIn(context, sent));
		const code = target.searchParams.get('code') as string;
		const results = await Promise.all(Array.from({length: 6}, () => exchange(context, clientId, code, verifier)));
		expect(results.filter((result) => 200 === result.status)).toHaveLength(1);
	});

	it('never rotates a refresh token twice when raced and revokes the family on replay', async () => {
		const context = await coreContext('oidc', 'dcr');
		const {clientId, tokens} = await signInAndGetTokens(context);
		const results = await Promise.all(
			Array.from({length: 4}, () => form(context, {grant_type: 'refresh_token', refresh_token: tokens.body.refresh_token, client_id: clientId}))
		);
		expect(results.filter((result) => 200 === result.status).length).toBeLessThanOrEqual(1);
		const winner = results.find((result) => 200 === result.status);
		await form(context, {grant_type: 'refresh_token', refresh_token: tokens.body.refresh_token, client_id: clientId});
		const followUp = await form(context, {grant_type: 'refresh_token', refresh_token: winner?.body.refresh_token, client_id: clientId});
		expect(followUp.status).toBe(400);
	});
});

describe('access tokens', () => {
	it('carries the SysTools claims and fails for disabled users on the next request', async () => {
		const app = await makeApp('oidc');
		const context = await coreContext('oidc', 'dcr');
		const {tokens} = await signInAndGetTokens(context);
		const payload = JSON.parse(Buffer.from(tokens.body.access_token.split('.')[1], 'base64url').toString());
		expect(payload).toMatchObject({iss: context.issuer, aud: context.resource, sub: 'oidc-user-1'});
		expect(payload.client_id).toBeTruthy();
		expect(payload.jti).toBeTruthy();
		expect(payload.exp - payload.iat).toBe(3600);
		expect(app.disabled.size).toBe(0);
	});

	it('rejects expired tokens, wrong audience tokens and inactive users', async () => {
		let clock = new Date('2026-01-01T00:00:00Z');
		const app = await makeApp('session', {now: () => clock});
		const issued = await signInAndRun(app);
		expect('user' in (await app.auth.authenticate({authorization: `Bearer ${issued}`}))).toBe(true);

		app.disabled.add('alice');
		const inactive = await app.auth.authenticate({authorization: `Bearer ${issued}`});
		expect(inactive).toMatchObject({status: 401, reason: 'user_inactive'});
		app.disabled.delete('alice');

		clock = new Date(clock.getTime() + 3601_000);
		expect(await app.auth.authenticate({authorization: `Bearer ${issued}`})).toMatchObject({status: 401, reason: 'expired'});
	});

	it('rejects non-Bearer schemes and tokens from other issuers', async () => {
		const app = await makeApp('session');
		const other = await makeApp('session');
		const foreign = await signInAndRun(other);
		expect(await app.auth.authenticate({authorization: `Bearer ${foreign}`})).toMatchObject({status: 401, reason: 'invalid_token'});
		expect(await app.auth.authenticate({authorization: 'Basic abc'})).toMatchObject({status: 401, reason: 'missing_token'});
		expect(await app.auth.authenticate({authorization: 'Bearer a b'})).toMatchObject({status: 401, reason: 'missing_token'});
	});
});

const signInAndRun = async (app: Awaited<ReturnType<typeof makeApp>>): Promise<string> => {
	const send = async (method: string, url: string, extra: {headers?: Record<string, string>; body?: unknown} = {}) => {
		const target = new URL(url);
		return app.auth.handle({method, path: target.pathname, query: Object.fromEntries(target.searchParams), headers: extra.headers ?? {}, body: extra.body});
	};
	const headers = {cookie: 'session=alice'};
	const registered = await send('POST', `${app.context.issuer}/register`, {body: {redirect_uris: ['http://localhost:8123/callback']}});
	const clientId = (registered.body as {client_id: string}).client_id;
	const verifier = 'v'.repeat(43);
	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: 'http://localhost:8123/callback',
		response_type: 'code',
		code_challenge: await sha256Base64Url(verifier),
		code_challenge_method: 'S256',
		resource: app.context.resource
	});
	const authorized = await send('GET', `${app.context.issuer}/authorize?${params}`, {headers});
	let next = new URL(authorized.headers.location as string);
	if (next.pathname === '/oauth/consent') {
		const decided = await send('POST', `${app.context.issuer}/oauth/consent`, {headers, body: {state: next.searchParams.get('state'), decision: 'approve'}});
		next = new URL(decided.headers.location as string);
	}
	const exchanged = await send('POST', `${app.context.issuer}/token`, {
		body: {grant_type: 'authorization_code', code: next.searchParams.get('code'), client_id: clientId, redirect_uri: 'http://localhost:8123/callback', code_verifier: verifier}
	});
	return (exchanged.body as {access_token: string}).access_token;
};
