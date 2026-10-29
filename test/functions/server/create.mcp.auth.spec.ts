'use strict';

import createMcpAuth from '../../../src/functions/server/create.mcp.auth';
import MemoryStorage from '../../../src/storage/memory.storage';
import type McpAuthOptionsType from '../../../src/types/mcp.auth.options.type';
import {fixedNow, getKeyPair, issuerUrl, resourceUrl} from '../../helpers/server.fixtures';

const buildOptions = async (overrides: Partial<McpAuthOptionsType<any>> = {}): Promise<McpAuthOptionsType<any>> => {
	const keys = await getKeyPair();
	return {
		issuer: `${issuerUrl}/`,
		resource: resourceUrl,
		signingKey: keys.privateKey,
		verificationKey: keys.publicKey,
		storage: new MemoryStorage(),
		upstream: {begin: jest.fn()},
		loadActiveUser: jest.fn(async (id: string) => ({id})),
		now: () => fixedNow,
		...overrides
	};
};

describe('create.mcp.auth tests', () => {
	it('should be defined', () => {
		expect(createMcpAuth).toBeDefined();
		expect(typeof createMcpAuth).toBe('function');
	});

	it('should return the public shape', async () => {
		const auth = createMcpAuth(await buildOptions());

		expect(auth.issuer).toBe(issuerUrl);
		expect(auth.resource).toBe(resourceUrl);
		expect(Array.isArray(auth.routes)).toBe(true);
		expect(auth.routes.length).toBeGreaterThan(0);
		expect(typeof auth.hasRoute).toBe('function');
		expect(typeof auth.handle).toBe('function');
		expect(typeof auth.authenticate).toBe('function');
		expect(typeof auth.deleteExpired).toBe('function');
	});

	it('should know its routes', async () => {
		const auth = createMcpAuth(await buildOptions());

		expect(auth.hasRoute({method: 'post', path: '/token', query: {}, headers: {}})).toBe(true);
		expect(auth.hasRoute({method: 'GET', path: '/token', query: {}, headers: {}})).toBe(false);
	});

	it('should handle requests through the routes', async () => {
		const auth = createMcpAuth(await buildOptions());

		const unknown = await auth.handle({method: 'GET', path: '/nope', query: {}, headers: {}});
		const metadata = await auth.handle({method: 'GET', path: '/.well-known/oauth-protected-resource', query: {}, headers: {}});

		expect(unknown.status).toBe(404);
		expect(metadata.status).toBe(200);
	});

	it('should authenticate through the context', async () => {
		const auth = createMcpAuth(await buildOptions());

		const result: any = await auth.authenticate({}, {id: 1});

		expect(result.status).toBe(401);
		expect(result.body.id).toBe(1);
	});

	it('should delete expired records with the context clock', async () => {
		const storage = new MemoryStorage();
		const spy = jest.spyOn(storage, 'deleteExpired');
		const auth = createMcpAuth(await buildOptions({storage}));

		await auth.deleteExpired();

		expect(spy).toHaveBeenCalledWith(fixedNow);
	});
});
