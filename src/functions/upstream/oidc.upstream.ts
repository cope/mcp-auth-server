'use strict';

import type IUpstream from '../../types/i.upstream';
import type OidcUpstreamOptionsType from '../../types/oidc.upstream.options.type';
import type UpstreamBeginType from '../../types/upstream.begin.type';
import type UpstreamContextType from '../../types/upstream.context.type';
import sha256Base64Url from '../crypto/sha256.base64.url';
import queryParam from '../http/query.param';
import verifyIdToken from './verify.id.token';

type DiscoveryType = {issuer: string; authorization_endpoint: string; token_endpoint: string; jwks_uri: string};

const oidcUpstream = (options: OidcUpstreamOptionsType): IUpstream => {
	const fetchImpl: typeof fetch = options.fetch ?? ((input: any, init?: RequestInit): Promise<Response> => fetch(input, init));
	let discovery: Promise<DiscoveryType> | undefined;
	let jwks: Promise<unknown> | undefined;

	const loadDiscovery = (): Promise<DiscoveryType> => {
		discovery ??= (async (): Promise<DiscoveryType> => {
			const response: Response = await fetchImpl(options.discoveryUrl);
			if (!response.ok) throw new Error(`OIDC discovery failed with status ${response.status}`);
			return (await response.json()) as DiscoveryType;
		})().catch((error: unknown): never => {
			discovery = undefined;
			throw error;
		});
		return discovery;
	};

	const loadJwks = async (force: boolean): Promise<unknown> => {
		if (force) jwks = undefined;
		jwks ??= (async (): Promise<unknown> => {
			const {jwks_uri} = await loadDiscovery();
			const response: Response = await fetchImpl(jwks_uri);
			if (!response.ok) throw new Error(`OIDC jwks fetch failed with status ${response.status}`);
			return response.json();
		})().catch((error: unknown): never => {
			jwks = undefined;
			throw error;
		});
		return jwks;
	};

	return {
		async begin(context: UpstreamContextType): Promise<UpstreamBeginType> {
			const metadata: DiscoveryType = await loadDiscovery();
			const url: URL = new URL(metadata.authorization_endpoint);
			url.search = new URLSearchParams({
				client_id: options.clientId,
				response_type: 'code',
				redirect_uri: context.callbackUrl,
				scope: options.scope ?? 'openid profile email',
				state: context.pending.stateId,
				code_challenge: await sha256Base64Url(context.pending.upstreamCodeVerifier ?? ''),
				code_challenge_method: 'S256'
			}).toString();
			return {type: 'redirect', url: url.toString()};
		},

		async callback(context: UpstreamContextType): Promise<Record<string, unknown> | null> {
			const code: string | undefined = queryParam(context.request, 'code');
			if (queryParam(context.request, 'error') || !code) return null;
			const metadata: DiscoveryType = await loadDiscovery();

			const response: Response = await fetchImpl(metadata.token_endpoint, {
				method: 'POST',
				headers: {'content-type': 'application/x-www-form-urlencoded', accept: 'application/json'},
				body: new URLSearchParams({
					grant_type: 'authorization_code',
					code,
					redirect_uri: context.callbackUrl,
					client_id: options.clientId,
					client_secret: options.clientSecret,
					code_verifier: context.pending.upstreamCodeVerifier ?? ''
				}).toString()
			});
			if (!response.ok) return null;
			const tokens = (await response.json()) as {id_token?: string};
			if (!tokens.id_token) return null;

			return (await verifyIdToken(tokens.id_token, loadJwks, metadata.issuer, options.clientId, options.now?.())) as Record<string, unknown>;
		}
	};
};
export default oidcUpstream;
