'use strict';

import {generateKeyPair} from 'jose';

import {appSessionUpstream, createMcpAuth, oidcUpstream} from '../../src/mcp.auth.server';
import type {AuthenticatedUserType, McpAuthOptionsType, McpAuthType, IStorage} from '../../src/mcp.auth.server';
import MemoryStorage from '../../src/storage/memory.storage';
import {createFakeOidc, idpClientId, idpIssuer} from './fakes';
import type {FlowContext} from './flow';
import {redirectUri} from './flow';

export const issuer = 'https://auth.test';
export const resource = `${issuer}/mcp`;
export const cimdClientId = 'https://client.example/client.json';

export type TestUser = {id: string; displayName?: string};

export const cimdFetch = (overrides: Partial<Record<string, unknown>> = {}, headers: Record<string, string> = {'cache-control': 'max-age=60'}): typeof fetch =>
	(async (input: string | URL | Request): Promise<Response> => {
		const url = String(input);
		if (url !== cimdClientId) return new Response('missing', {status: 404});
		return Response.json({client_id: cimdClientId, client_name: 'CIMD Client', redirect_uris: [redirectUri], ...overrides}, {headers});
	}) as typeof fetch;

export const sessionUser = (cookie: string | undefined): AuthenticatedUserType | null => {
	const match = /session=(\w+)/.exec(cookie ?? '');
	return match ? {id: match[1] as string, displayName: `Session ${match[1]}`} : null;
};

export type TestApp = {
	auth: McpAuthType<TestUser>;
	storage: IStorage;
	disabled: Set<string>;
	context: Omit<FlowContext, 'send' | 'mcp'>;
};

export const makeApp = async (kind: 'oidc' | 'session', overrides: Partial<McpAuthOptionsType<TestUser>> = {}, base: string = issuer): Promise<TestApp> => {
	const {privateKey} = await generateKeyPair('RS256', {extractable: true});
	const storage = overrides.storage ?? new MemoryStorage();
	const disabled = new Set<string>();
	const fakeOidc = await createFakeOidc();

	const upstream =
		'oidc' === kind
			? oidcUpstream({discoveryUrl: `${idpIssuer}/.well-known/openid-configuration`, clientId: idpClientId, clientSecret: 'idp-secret', fetch: fakeOidc.fetch})
			: appSessionUpstream({
					getSignedInUser: (request) => sessionUser(request.headers.cookie as string | undefined),
					signInUrl: (returnTo: string): string => `https://app.test/login?returnTo=${encodeURIComponent(returnTo)}`
				});

	const auth = createMcpAuth<TestUser>({
		issuer: base,
		resource: `${base}/mcp`,
		signingKey: privateKey as CryptoKey,
		storage,
		upstream,
		redirects: {customSchemes: ['cursor://']},
		cimd: {fetch: cimdFetch()},
		productName: 'Test MCP',
		resolveUser: (claims) => ({id: String(claims.sub), displayName: String(claims.name)}),
		loadActiveUser: (id: string): TestUser | null => (disabled.has(id) ? null : {id}),
		...overrides
	});

	const signIn: FlowContext['signIn'] = async (upstreamLocation: string) => {
		const target = new URL(upstreamLocation);
		if ('oidc' === kind) {
			if (target.origin + target.pathname !== `${idpIssuer}/authorize`) throw new Error(`unexpected upstream ${upstreamLocation}`);
			if ('S256' !== target.searchParams.get('code_challenge_method')) throw new Error('upstream PKCE missing');
			const callback = new URL(target.searchParams.get('redirect_uri') as string);
			callback.searchParams.set('code', 'upstream-code');
			callback.searchParams.set('state', target.searchParams.get('state') as string);
			return {next: callback.toString()};
		}
		return {next: target.searchParams.get('returnTo') as string, headers: {cookie: 'session=alice'}};
	};

	return {
		auth,
		storage,
		disabled,
		context: {issuer: base, resource: `${base}/mcp`, signIn, registration: 'dcr', cimdClientId, expectedUserId: 'oidc' === kind ? 'oidc-user-1' : 'alice'}
	};
};
