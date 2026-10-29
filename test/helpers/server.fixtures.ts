'use strict';

import {generateKeyPair} from 'jose';

import MemoryStorage from '../../src/storage/memory.storage';
import type KeyPairType from '../../src/types/key.pair.type';
import type McpAuthContextType from '../../src/types/mcp.auth.context.type';
import type McpAuthOptionsType from '../../src/types/mcp.auth.options.type';
import type PendingAuthorizationType from '../../src/types/pending.authorization.type';

export const fixedNow: Date = new Date('2030-01-01T00:00:00.000Z');
export const issuerUrl: string = 'https://auth.example.com';
export const resourceUrl: string = 'https://api.example.com/mcp';

let keyPairPromise: Promise<KeyPairType> | undefined;

export const getKeyPair = (): Promise<KeyPairType> => {
	keyPairPromise ??= generateKeyPair('RS256', {extractable: true}) as Promise<KeyPairType>;
	return keyPairPromise;
};

export type ContextOverrides = {
	options?: Partial<McpAuthOptionsType<any>>;
	context?: Partial<McpAuthContextType<any>>;
};

export const buildContext = async (overrides: ContextOverrides = {}): Promise<McpAuthContextType<any>> => {
	const keys: KeyPairType = await getKeyPair();
	const options: McpAuthOptionsType<any> = {
		issuer: issuerUrl,
		resource: resourceUrl,
		signingKey: keys.privateKey,
		verificationKey: keys.publicKey,
		storage: new MemoryStorage(),
		upstream: {begin: jest.fn()},
		loadActiveUser: jest.fn(async (id: string) => ({id})),
		...overrides.options
	};
	return {
		options,
		issuer: issuerUrl,
		basePath: '',
		callbackPath: '/oauth/callback',
		productName: 'MCP server',
		redirectPolicy: {httpsHosts: [], customSchemes: []},
		ttl: {accessToken: 3600, refreshToken: 2592000, pending: 600, code: 60},
		now: () => fixedNow,
		registrationEnabled: true,
		cimdEnabled: true,
		renderConsent: jest.fn(() => '<html></html>'),
		resourceMetadataUrl: `${issuerUrl}/.well-known/oauth-protected-resource`,
		getKeys: async () => keys,
		resolveClient: jest.fn(),
		...overrides.context
	};
};

export const buildPending = (overrides: Partial<PendingAuthorizationType> = {}): PendingAuthorizationType => ({
	stateId: 'state-1',
	clientId: 'client-1',
	redirectUri: 'https://client.example.com/cb',
	codeChallenge: 'challenge',
	resource: resourceUrl,
	clientState: 'client-state',
	expiresAt: new Date(fixedNow.getTime() + 600000),
	...overrides
});
