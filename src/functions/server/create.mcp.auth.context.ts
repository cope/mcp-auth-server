'use strict';

import trimTrailingSlashes from '../http/trim.trailing.slashes';
import type McpAuthContextType from '../../types/mcp.auth.context.type';
import type McpAuthOptionsType from '../../types/mcp.auth.options.type';
import renderDefaultConsent from '../consent/render.default.consent';
import resolveKeyPair from '../keys/resolve.key.pair';
import createClientResolver from './create.client.resolver';

const createMcpAuthContext = <TUser>(options: McpAuthOptionsType<TUser>): McpAuthContextType<TUser> => {
	const issuer: string = trimTrailingSlashes(options.issuer);
	const now: () => Date = options.now ?? ((): Date => new Date());
	const cimdEnabled: boolean = options.cimd?.enabled ?? true;
	let keys: ReturnType<typeof resolveKeyPair> | undefined;

	return {
		options,
		issuer,
		basePath: trimTrailingSlashes(new URL(issuer).pathname),
		callbackPath: options.callbackPath ?? '/oauth/callback',
		productName: options.productName ?? 'MCP server',
		redirectPolicy: {httpsHosts: options.redirects?.httpsHosts ?? [], customSchemes: options.redirects?.customSchemes ?? []},
		ttl: {
			accessToken: options.ttl?.accessToken ?? 3600,
			refreshToken: options.ttl?.refreshToken ?? 2592000,
			pending: options.ttl?.pending ?? 600,
			code: options.ttl?.code ?? 60
		},
		now,
		registrationEnabled: options.registration?.enabled ?? true,
		cimdEnabled,
		renderConsent: options.renderConsent ?? renderDefaultConsent,
		resourceMetadataUrl: `${issuer}/.well-known/oauth-protected-resource`,
		getKeys: () => (keys ??= resolveKeyPair(options.signingKey, options.verificationKey)),
		resolveClient: createClientResolver(options, now, cimdEnabled)
	};
};
export default createMcpAuthContext;
