'use strict';

import createMcpAuthContext from '../../../src/functions/server/create.mcp.auth.context';
import MemoryStorage from '../../../src/storage/memory.storage';
import type McpAuthOptionsType from '../../../src/types/mcp.auth.options.type';
import {fixedNow, getKeyPair, issuerUrl, resourceUrl} from '../../helpers/server.fixtures';

const buildOptions = async (overrides: Partial<McpAuthOptionsType<any>> = {}): Promise<McpAuthOptionsType<any>> => {
	const keys = await getKeyPair();
	return {
		issuer: issuerUrl,
		resource: resourceUrl,
		signingKey: keys.privateKey,
		verificationKey: keys.publicKey,
		storage: new MemoryStorage(),
		upstream: {begin: jest.fn()},
		loadActiveUser: jest.fn(),
		...overrides
	};
};

describe('create.mcp.auth.context tests', () => {
	it('should be defined', () => {
		expect(createMcpAuthContext).toBeDefined();
		expect(typeof createMcpAuthContext).toBe('function');
	});

	it('should apply defaults', async () => {
		const options = await buildOptions();

		const context = createMcpAuthContext(options);

		expect(context.options).toBe(options);
		expect(context.issuer).toBe(issuerUrl);
		expect(context.basePath).toBe('');
		expect(context.callbackPath).toBe('/oauth/callback');
		expect(context.productName).toBe('MCP server');
		expect(context.redirectPolicy).toEqual({httpsHosts: [], customSchemes: []});
		expect(context.ttl).toEqual({accessToken: 3600, refreshToken: 2592000, pending: 600, code: 60});
		expect(context.registrationEnabled).toBe(true);
		expect(context.cimdEnabled).toBe(true);
		expect(context.resourceMetadataUrl).toBe(`${issuerUrl}/.well-known/oauth-protected-resource`);
		expect(context.now()).toBeInstanceOf(Date);
		expect(typeof context.renderConsent).toBe('function');
		expect(typeof context.resolveClient).toBe('function');
	});

	it('should apply overrides', async () => {
		const now = (): Date => fixedNow;
		const renderConsent = jest.fn(() => 'custom');
		const options = await buildOptions({
			callbackPath: '/cb',
			productName: 'Acme',
			redirects: {httpsHosts: ['app.example.com'], customSchemes: ['myapp']},
			ttl: {accessToken: 1, refreshToken: 2, pending: 3, code: 4},
			registration: {enabled: false},
			cimd: {enabled: false},
			renderConsent,
			now
		});

		const context = createMcpAuthContext(options);

		expect(context.callbackPath).toBe('/cb');
		expect(context.productName).toBe('Acme');
		expect(context.redirectPolicy).toEqual({httpsHosts: ['app.example.com'], customSchemes: ['myapp']});
		expect(context.ttl).toEqual({accessToken: 1, refreshToken: 2, pending: 3, code: 4});
		expect(context.registrationEnabled).toBe(false);
		expect(context.cimdEnabled).toBe(false);
		expect(context.renderConsent).toBe(renderConsent);
		expect(context.now).toBe(now);
	});

	it('should trim trailing slashes from the issuer and derive the base path', async () => {
		const context = createMcpAuthContext(await buildOptions({issuer: 'https://auth.example.com/tenant/one//'}));

		expect(context.issuer).toBe('https://auth.example.com/tenant/one');
		expect(context.basePath).toBe('/tenant/one');
		expect(context.resourceMetadataUrl).toBe('https://auth.example.com/tenant/one/.well-known/oauth-protected-resource');
	});

	it('should lazily resolve and cache the key pair', async () => {
		const options = await buildOptions();
		const context = createMcpAuthContext(options);

		const first = context.getKeys();
		const second = context.getKeys();

		expect(second).toBe(first);
		expect(await first).toEqual({privateKey: options.signingKey, publicKey: options.verificationKey});
	});

	it('should resolve clients through the storage', async () => {
		const options = await buildOptions();
		const context = createMcpAuthContext(options);

		expect(await context.resolveClient('missing')).toEqual({error: 'unknown client_id'});
	});
});
