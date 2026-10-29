'use strict';

import {makeApp} from '../helpers/app';
import {coreContext} from '../helpers/core.harness';
import {runFullFlow} from '../helpers/flow';

describe.each([['oidc'], ['session']] as const)('core flow with %s upstream', (kind) => {
	it.each([['dcr'], ['cimd']] as const)('completes the full flow via %s', async (registration) => {
		await expect(runFullFlow(await coreContext(kind, registration))).resolves.toBeUndefined();
	});

	it('returns the JSON-RPC challenge with the request id', async () => {
		const context = await coreContext(kind, 'dcr');
		const result = await context.mcp({});
		expect(result.body).toEqual({jsonrpc: '2.0', id: 7, error: {code: -32000, message: 'Authentication Required'}});
	});
});

describe('app-session shortcuts', () => {
	it('skips the sign-in redirect when the user is already signed in', async () => {
		const context = await coreContext('session', 'dcr');
		context.sessionHeaders = {cookie: 'session=alice'};
		await expect(runFullFlow(context)).resolves.toBeUndefined();
	});
});

describe('handler errors', () => {
	it('answers 404 for unknown routes', async () => {
		const app = await makeApp('oidc');
		expect((await app.auth.handle({method: 'GET', path: '/nope', query: {}, headers: {}})).status).toBe(404);
	});

	it('applies the rate limit hook to register, token and revoke only', async () => {
		const calls: string[] = [];
		const app = await makeApp('oidc', {
			rateLimit: (key, route) => {
				calls.push(`${key}:${route}`);
				return false;
			}
		});
		const limited = await app.auth.handle({method: 'POST', path: '/token', query: {}, headers: {}, ip: 'client-ip', body: {}});
		expect(limited.status).toBe(429);
		expect(calls).toEqual(['client-ip:token']);
		expect((await app.auth.handle({method: 'GET', path: '/.well-known/oauth-protected-resource', query: {}, headers: {}})).status).toBe(200);
		expect(calls).toHaveLength(1);
	});

	it('disables registration on request and stops advertising it', async () => {
		const app = await makeApp('oidc', {registration: {enabled: false}});
		expect((await app.auth.handle({method: 'POST', path: '/register', query: {}, headers: {}, body: {}})).status).toBe(404);
		const metadata = await app.auth.handle({method: 'GET', path: '/.well-known/oauth-authorization-server', query: {}, headers: {}});
		expect((metadata.body as Record<string, unknown>).registration_endpoint).toBeUndefined();
	});
});
