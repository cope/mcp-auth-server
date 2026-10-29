'use strict';

import http from 'node:http';
import type {AddressInfo} from 'node:net';

import {generateKeyPair} from 'jose';

import MemoryStorage from '../../src/storage/memory.storage';
import type AuthenticatedUserType from '../../src/types/authenticated.user.type';
import type ClientRecordType from '../../src/types/client.record.type';
import type HttpRequestType from '../../src/types/http.request.type';
import type HttpResponseType from '../../src/types/http.response.type';
import type IUpstream from '../../src/types/i.upstream';
import type KeyPairType from '../../src/types/key.pair.type';
import type McpAuthContextType from '../../src/types/mcp.auth.context.type';
import type McpAuthOptionsType from '../../src/types/mcp.auth.options.type';
import type PendingAuthorizationType from '../../src/types/pending.authorization.type';
import type RouteType from '../../src/types/route.type';

export const issuer: string = 'https://auth.test/base';
export const resource: string = `${issuer}/mcp`;
export const clientId: string = 'client-1';
export const redirectUri: string = 'https://app.example/callback';
export const codeChallenge: string = 'A'.repeat(43);
export const fixedNow: Date = new Date('2030-01-01T00:00:00.000Z');

export type FakeUpstream = {
	begin: jest.Mock;
	callback: jest.Mock;
	resume: jest.Mock;
	verifyUser: jest.Mock;
};

export type FakeLogger = {info: jest.Mock; warn: jest.Mock; error: jest.Mock};

export type Fixture = {
	context: McpAuthContextType<any>;
	storage: MemoryStorage;
	upstream: FakeUpstream;
	logger: FakeLogger;
	renderConsent: jest.Mock;
	resolveClient: jest.Mock;
};

export type FixtureOverrides = {
	options?: Partial<McpAuthOptionsType<any>>;
	context?: Partial<McpAuthContextType<any>>;
};

let keyPairPromise: Promise<KeyPairType> | undefined;

export const generateKeys = (): Promise<KeyPairType> => (keyPairPromise ??= generateKeyPair('RS256', {extractable: true}) as unknown as Promise<KeyPairType>);

export const createFakeUpstream = (): FakeUpstream => ({
	begin: jest.fn(async () => ({type: 'redirect', url: 'https://idp.test/authorize'})),
	callback: jest.fn(async () => ({sub: 'user-1', name: 'User One'})),
	resume: jest.fn(async () => ({id: 'user-1', displayName: 'User One'})),
	verifyUser: jest.fn(async () => true)
});

export const createFakeLogger = (): FakeLogger => ({info: jest.fn(), warn: jest.fn(), error: jest.fn()});

export const buildFixture = async (overrides: FixtureOverrides = {}): Promise<Fixture> => {
	const keys: KeyPairType = await generateKeys();
	const storage: MemoryStorage = new MemoryStorage();
	const upstream: FakeUpstream = createFakeUpstream();
	const logger: FakeLogger = createFakeLogger();
	const renderConsent: jest.Mock = jest.fn((): string => '<html>consent</html>');
	const resolveClient: jest.Mock = jest.fn(async (id: string) => {
		const client: ClientRecordType | null = await storage.getClient(id);
		return client ? {clientId: client.clientId, clientName: client.clientName, redirectUris: client.redirectUris, metadataDocument: false} : {error: 'unknown client_id'};
	});

	const options: McpAuthOptionsType<any> = {
		issuer,
		resource,
		signingKey: keys.privateKey,
		storage,
		upstream: upstream as unknown as IUpstream,
		loadActiveUser: (id: string) => ({id}),
		logger,
		...overrides.options
	};

	const context: McpAuthContextType<any> = {
		options,
		issuer,
		basePath: '/base',
		callbackPath: '/oauth/callback',
		productName: 'Test MCP',
		redirectPolicy: {httpsHosts: ['app.example'], customSchemes: ['cursor://']},
		ttl: {accessToken: 3600, refreshToken: 86400, pending: 600, code: 60},
		now: (): Date => fixedNow,
		registrationEnabled: true,
		cimdEnabled: true,
		renderConsent,
		resourceMetadataUrl: `${issuer}/.well-known/oauth-protected-resource`,
		getKeys: async (): Promise<KeyPairType> => keys,
		resolveClient,
		...overrides.context
	};

	return {context, storage, upstream, logger, renderConsent, resolveClient};
};

export const seedClient = async (storage: MemoryStorage, overrides: Partial<ClientRecordType> = {}): Promise<ClientRecordType> => {
	const client: ClientRecordType = {
		clientId,
		clientName: 'Test Client',
		redirectUris: [redirectUri],
		tokenEndpointAuthMethod: 'none',
		grantTypes: ['authorization_code', 'refresh_token'],
		responseTypes: ['code'],
		createdAt: fixedNow,
		...overrides
	};
	await storage.saveClient(client);
	return client;
};

export const seedPending = async (storage: MemoryStorage, overrides: Partial<PendingAuthorizationType> = {}): Promise<PendingAuthorizationType> => {
	const pending: PendingAuthorizationType = {
		stateId: 'state-1',
		clientId,
		clientName: 'Test Client',
		redirectUri,
		codeChallenge,
		resource,
		clientState: 'client-state',
		upstreamCodeVerifier: 'verifier',
		expiresAt: new Date(fixedNow.getTime() + 600000),
		...overrides
	};
	await storage.savePendingAuthorization(pending);
	return pending;
};

export const buildRequest = (overrides: Partial<HttpRequestType> = {}): HttpRequestType => ({method: 'GET', path: '/', query: {}, headers: {}, ...overrides});

export const authorizeRequest = (query: Record<string, string | string[] | undefined> = {}): HttpRequestType =>
	buildRequest({
		path: '/base/authorize',
		query: {
			client_id: clientId,
			redirect_uri: redirectUri,
			response_type: 'code',
			code_challenge: codeChallenge,
			code_challenge_method: 'S256',
			resource,
			state: 'client-state',
			...query
		}
	});

export const stateRequest = (state: string | undefined = 'state-1'): HttpRequestType => buildRequest({query: {state}});

export const formRequest = (body: unknown, headers: Record<string, string> = {}): HttpRequestType => buildRequest({method: 'POST', body, headers});

export const locationOf = (response: HttpResponseType): URL => new URL(response.headers.location as string);

export const asUser = (id: string = 'user-1', displayName?: string): AuthenticatedUserType => ({id, displayName});

export type FakeAuth = {
	issuer: string;
	resource: string;
	routes: RouteType[];
	hasRoute: jest.Mock;
	handle: jest.Mock;
	authenticate: jest.Mock;
	deleteExpired: jest.Mock;
};

export const knownPath: string = '/known';

export const createFakeAuth = (response: HttpResponseType = {status: 200, headers: {'content-type': 'application/json', 'x-test': 'yes'}, body: {ok: true}}): FakeAuth => ({
	issuer,
	resource,
	routes: [
		{method: 'GET', path: knownPath, name: 'metadata', handler: async (): Promise<HttpResponseType> => response},
		{method: 'POST', path: knownPath, name: 'token', handler: async (): Promise<HttpResponseType> => response}
	],
	hasRoute: jest.fn((request: HttpRequestType): boolean => knownPath === request.path),
	handle: jest.fn(async (): Promise<HttpResponseType> => response),
	authenticate: jest.fn(),
	deleteExpired: jest.fn()
});

export type RunningServer = {baseUrl: string; close: () => Promise<void>};

export const startServer = async (listener: http.RequestListener): Promise<RunningServer> => {
	const server: http.Server = http.createServer(listener);
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	const {port} = server.address() as AddressInfo;
	return {baseUrl: `http://127.0.0.1:${port}`, close: (): Promise<void> => new Promise<void>((resolve) => server.close(() => resolve()))};
};
