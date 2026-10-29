'use strict';

import entraUpstream from '../../../src/functions/upstream/entra.upstream';
import type UpstreamContextType from '../../../src/types/upstream.context.type';

const context = {
	request: {method: 'GET', path: '/', query: {}, headers: {}},
	pending: {stateId: 'state-1', upstreamCodeVerifier: 'v'},
	issuer: 'https://mcp.test',
	callbackUrl: 'https://mcp.test/callback',
	resumeUrl: 'https://mcp.test/resume'
} as unknown as UpstreamContextType;

const capture = () =>
	jest.fn(
		async () =>
			new Response(
				JSON.stringify({
					issuer: 'https://login.microsoftonline.com/t/v2.0',
					authorization_endpoint: 'https://login.microsoftonline.com/t/oauth2/v2.0/authorize',
					token_endpoint: 'x',
					jwks_uri: 'y'
				})
			)
	);

describe('entra.upstream tests', () => {
	it('should be defined', () => {
		expect(entraUpstream).toBeDefined();
		expect(typeof entraUpstream).toBe('function');
	});

	it('should discover from the tenant specific url and use the default scope', async () => {
		const fetchMock = capture();
		const result = await entraUpstream({tenantId: 'my tenant/1', clientId: 'c', clientSecret: 's', fetch: fetchMock as unknown as typeof fetch}).begin(context);
		expect(fetchMock).toHaveBeenCalledWith('https://login.microsoftonline.com/my%20tenant%2F1/v2.0/.well-known/openid-configuration');
		const url = new URL((result as {url: string}).url);
		expect(url.searchParams.get('scope')).toBe('openid profile email');
		expect(url.searchParams.get('client_id')).toBe('c');
	});

	it('should honor a custom scope', async () => {
		const result = await entraUpstream({tenantId: 't', clientId: 'c', clientSecret: 's', scope: 'openid', fetch: capture() as unknown as typeof fetch}).begin(context);
		expect(new URL((result as {url: string}).url).searchParams.get('scope')).toBe('openid');
	});
});
