'use strict';

import LruMetadataCache from '../../../src/cache/lru.metadata.cache';
import createMetadataResolver from '../../../src/functions/cimd/create.metadata.resolver';

const clientId = 'https://client.example/meta.json';
const document = (overrides: Record<string, unknown> = {}) => ({client_id: clientId, client_name: 'Client', redirect_uris: ['https://client.example/cb'], ...overrides});
const jsonResponse = (body: unknown, headers: Record<string, string> = {}, status = 200): Response => new Response(JSON.stringify(body), {status, headers});

describe('create.metadata.resolver tests', () => {
	let fetchMock: jest.Mock;
	let time: number;

	const resolverWith = (options: Record<string, unknown> = {}, cache = new LruMetadataCache(10, () => time)) =>
		createMetadataResolver({fetch: fetchMock as unknown as typeof fetch, ...options}, cache);

	beforeEach(() => {
		time = 1000;
		fetchMock = jest.fn(async () => jsonResponse(document()));
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('should be defined', () => {
		expect(createMetadataResolver).toBeDefined();
		expect(typeof createMetadataResolver).toBe('function');
	});

	it('should resolve metadata and fetch with manual redirect', async () => {
		const result = await resolverWith()(clientId);
		expect(result).toEqual({ok: true, metadata: document()});
		expect(fetchMock).toHaveBeenCalledWith(clientId, expect.objectContaining({redirect: 'manual', headers: {accept: 'application/json'}}));
	});

	it('should fall back to the global fetch', async () => {
		const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(document()));
		const result = await createMetadataResolver({}, new LruMetadataCache())(clientId);
		expect(result.ok).toBe(true);
		expect(spy).toHaveBeenCalledWith(clientId, expect.objectContaining({redirect: 'manual'}));
	});

	it('should reject a client_id mismatch', async () => {
		fetchMock.mockResolvedValue(jsonResponse(document({client_id: 'https://other.example/m'})));
		expect(await resolverWith()(clientId)).toEqual({ok: false, reason: 'client_id in the metadata document does not match its URL'});
	});

	it('should reject missing client_name', async () => {
		fetchMock.mockResolvedValue(jsonResponse(document({client_name: undefined})));
		expect(await resolverWith()(clientId)).toEqual({ok: false, reason: 'client metadata document requires client_name'});
	});

	it('should reject missing redirect_uris', async () => {
		fetchMock.mockResolvedValue(jsonResponse(document({redirect_uris: undefined})));
		expect(await resolverWith()(clientId)).toEqual({ok: false, reason: 'client metadata document requires valid redirect_uris'});
	});

	it('should reject unsafe redirect uris', async () => {
		fetchMock.mockResolvedValue(jsonResponse(document({redirect_uris: ['javascript:alert(1)']})));
		expect((await resolverWith()(clientId)).ok).toBe(false);
	});

	it('should reject an oversize declared content-length', async () => {
		fetchMock.mockResolvedValue(jsonResponse(document(), {'content-length': '999999'}));
		expect(await resolverWith()(clientId)).toEqual({ok: false, reason: 'client metadata document is too large'});
	});

	it('should reject an oversize streamed body', async () => {
		fetchMock.mockResolvedValue(new Response(JSON.stringify(document({padding: 'x'.repeat(200)}))));
		expect(await resolverWith({maxBytes: 100})(clientId)).toEqual({ok: false, reason: 'client metadata document is too large'});
	});

	it('should time out through the abort signal', async () => {
		fetchMock.mockImplementation(
			(_url: string, init: RequestInit) =>
				new Promise((_resolve, reject) => {
					init.signal!.addEventListener('abort', () => reject(init.signal!.reason));
				})
		);
		const result = await resolverWith({timeoutMs: 10})(clientId);
		expect(result.ok).toBe(false);
	});

	it.each(['https://localhost/meta.json', 'https://127.0.0.1/meta.json', 'https://169.254.169.254/meta.json', 'https://10.0.0.5/meta.json', 'https://[::1]/meta.json'])(
		'should reject non-public host %s without fetching',
		async (url) => {
			expect(await resolverWith()(url)).toEqual({ok: false, reason: 'client metadata host is not a public address'});
			expect(fetchMock).not.toHaveBeenCalled();
		}
	);

	it('should report an invalid client id url', async () => {
		expect((await resolverWith()('not a url')).ok).toBe(false);
	});

	it('should surface an injected guard failure without fetching', async () => {
		const guard = jest.fn(async () => {
			throw new Error('guard says no');
		});
		expect(await resolverWith({guard})(clientId)).toEqual({ok: false, reason: 'guard says no'});
		expect(guard).toHaveBeenCalledWith(new URL(clientId));
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('should accept when the guard passes', async () => {
		expect((await resolverWith({guard: jest.fn()})(clientId)).ok).toBe(true);
	});

	it('should reject non-200 responses', async () => {
		fetchMock.mockResolvedValue(jsonResponse({}, {}, 404));
		expect(await resolverWith()(clientId)).toEqual({ok: false, reason: 'client metadata fetch returned status 404'});
	});

	it('should reject redirects', async () => {
		fetchMock.mockResolvedValue(new Response(null, {status: 302, headers: {location: 'https://elsewhere.example/'}}));
		expect(await resolverWith()(clientId)).toEqual({ok: false, reason: 'client metadata fetch returned status 302'});
	});

	it('should reject non-JSON bodies', async () => {
		fetchMock.mockResolvedValue(new Response('<html>'));
		expect(await resolverWith()(clientId)).toEqual({ok: false, reason: 'client metadata document is not valid JSON'});
	});

	it('should serve repeated resolutions from cache', async () => {
		const resolve = resolverWith();
		await resolve(clientId);
		const second = await resolve(clientId);
		expect(second).toEqual({ok: true, metadata: document()});
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('should refetch after the cache entry expires', async () => {
		fetchMock.mockImplementation(async () => jsonResponse(document(), {'cache-control': 'max-age=10'}));
		const resolve = resolverWith();
		await resolve(clientId);
		time += 11_000;
		await resolve(clientId);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('should not cache no-store responses', async () => {
		fetchMock.mockImplementation(async () => jsonResponse(document(), {'cache-control': 'no-store'}));
		const resolve = resolverWith();
		await resolve(clientId);
		await resolve(clientId);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('should clamp max-age to maxCacheSeconds', async () => {
		fetchMock.mockImplementation(async () => jsonResponse(document(), {'cache-control': 'max-age=99999'}));
		const resolve = resolverWith({maxCacheSeconds: 5});
		await resolve(clientId);
		time += 6000;
		await resolve(clientId);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('should use defaultCacheSeconds without cache-control', async () => {
		const resolve = resolverWith({defaultCacheSeconds: 2});
		await resolve(clientId);
		time += 1000;
		await resolve(clientId);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		time += 1500;
		await resolve(clientId);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('should deny listed hosts', async () => {
		expect(await resolverWith({trust: {denyHosts: ['client.example']}})(clientId)).toEqual({ok: false, reason: 'client host is denied'});
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('should deny hosts by wildcard pattern', async () => {
		expect((await resolverWith({trust: {denyHosts: ['*.example']}})(clientId)).ok).toBe(false);
	});

	it('should allow only listed hosts', async () => {
		expect((await resolverWith({trust: {allowHosts: ['*.example']}})(clientId)).ok).toBe(true);
		expect(await resolverWith({trust: {allowHosts: ['other.test']}})(clientId)).toEqual({ok: false, reason: 'client host is not allowed'});
	});

	it('should pass when deny list does not match', async () => {
		expect((await resolverWith({trust: {denyHosts: ['other.test']}})(clientId)).ok).toBe(true);
	});

	it('should use a generic reason for non-Error failures', async () => {
		fetchMock.mockRejectedValue('boom');
		expect(await resolverWith()(clientId)).toEqual({ok: false, reason: 'client metadata fetch failed'});
	});
});
