'use strict';

import createClientResolver from '../../../src/functions/server/create.client.resolver';
import MemoryStorage from '../../../src/storage/memory.storage';
import type McpAuthOptionsType from '../../../src/types/mcp.auth.options.type';
import {fixedNow, issuerUrl, resourceUrl} from '../../helpers/server.fixtures';

const metadataUrl: string = 'https://client.example.com/metadata.json';
const now = (): Date => fixedNow;

const metadataResponse = (overrides: Record<string, unknown> = {}): Response =>
	new Response(JSON.stringify({client_id: metadataUrl, client_name: 'Remote Client', redirect_uris: ['https://client.example.com/cb'], ...overrides}), {
		status: 200,
		headers: {'content-type': 'application/json', 'cache-control': 'max-age=60'}
	});

const buildOptions = async (overrides: Partial<McpAuthOptionsType<any>> = {}): Promise<McpAuthOptionsType<any>> => {
	const storage = new MemoryStorage();
	await storage.saveClient({
		clientId: 'stored-client',
		clientName: 'Stored Client',
		redirectUris: ['https://stored.example.com/cb'],
		tokenEndpointAuthMethod: 'none',
		grantTypes: [],
		responseTypes: [],
		createdAt: fixedNow
	});
	return {issuer: issuerUrl, resource: resourceUrl, signingKey: 'k', storage, upstream: {begin: jest.fn()}, loadActiveUser: jest.fn(), ...overrides};
};

describe('create.client.resolver tests', () => {
	it('should be defined', () => {
		expect(createClientResolver).toBeDefined();
		expect(typeof createClientResolver).toBe('function');
	});

	it('should resolve a client from storage', async () => {
		const resolve = createClientResolver(await buildOptions(), now, true);

		expect(await resolve('stored-client')).toEqual({
			clientId: 'stored-client',
			clientName: 'Stored Client',
			redirectUris: ['https://stored.example.com/cb'],
			metadataDocument: false
		});
	});

	it('should report an unknown client', async () => {
		const resolve = createClientResolver(await buildOptions(), now, true);

		expect(await resolve('missing')).toEqual({error: 'unknown client_id'});
	});

	it('should resolve a metadata document client with the injected fetch', async () => {
		const fetchMock = jest.fn(async () => metadataResponse());
		const resolve = createClientResolver(await buildOptions({cimd: {fetch: fetchMock as unknown as typeof fetch}}), now, true);

		const result = await resolve(metadataUrl);

		expect(result).toEqual({clientId: metadataUrl, clientName: 'Remote Client', redirectUris: ['https://client.example.com/cb'], metadataDocument: true});
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('should truncate the client name to 200 characters', async () => {
		const fetchMock = jest.fn(async () => metadataResponse({client_name: 'n'.repeat(500)}));
		const resolve = createClientResolver(await buildOptions({cimd: {fetch: fetchMock as unknown as typeof fetch}}), now, true);

		const result: any = await resolve(metadataUrl);

		expect(result.clientName).toHaveLength(200);
	});

	it('should log and return an error when the metadata document is rejected', async () => {
		const info = jest.fn();
		const fetchMock = jest.fn(async () => new Response('nope', {status: 500}));
		const resolve = createClientResolver(await buildOptions({logger: {info}, cimd: {fetch: fetchMock as unknown as typeof fetch}}), now, true);

		const result = await resolve(metadataUrl);

		expect(result).toEqual({error: 'client metadata document is invalid or unreachable'});
		expect(info).toHaveBeenCalledWith('MCP client metadata rejected', {clientId: metadataUrl, reason: 'client metadata fetch returned status 500'});
	});

	it('should not require a logger when the metadata document is rejected', async () => {
		const fetchMock = jest.fn(async () => new Response('nope', {status: 500}));
		const resolve = createClientResolver(await buildOptions({cimd: {fetch: fetchMock as unknown as typeof fetch}}), now, true);

		expect(await resolve(metadataUrl)).toEqual({error: 'client metadata document is invalid or unreachable'});
	});

	it('should tolerate a logger without an info method', async () => {
		const fetchMock = jest.fn(async () => new Response('nope', {status: 500}));
		const resolve = createClientResolver(await buildOptions({logger: {}, cimd: {fetch: fetchMock as unknown as typeof fetch}}), now, true);

		expect(await resolve(metadataUrl)).toEqual({error: 'client metadata document is invalid or unreachable'});
	});

	it('should treat an https url as a storage lookup when cimd is disabled', async () => {
		const fetchMock = jest.fn();
		const resolve = createClientResolver(await buildOptions({cimd: {fetch: fetchMock as unknown as typeof fetch}}), now, false);

		expect(await resolve(metadataUrl)).toEqual({error: 'unknown client_id'});
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('should use a custom cache from the options', async () => {
		const cache = {get: jest.fn(async () => undefined), set: jest.fn(async () => undefined)};
		const fetchMock = jest.fn(async () => metadataResponse());
		const resolve = createClientResolver(await buildOptions({cimd: {cache, fetch: fetchMock as unknown as typeof fetch}}), now, true);

		await resolve(metadataUrl);

		expect(cache.get).toHaveBeenCalledWith(metadataUrl);
		expect(cache.set).toHaveBeenCalledWith(metadataUrl, expect.objectContaining({client_name: 'Remote Client'}), 60);
	});

	it('should cache metadata in the default cache between resolutions', async () => {
		const fetchMock = jest.fn(async () => metadataResponse());
		const resolve = createClientResolver(await buildOptions({cimd: {fetch: fetchMock as unknown as typeof fetch}}), now, true);

		await resolve(metadataUrl);
		await resolve(metadataUrl);

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
});
