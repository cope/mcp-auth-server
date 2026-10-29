import {Hono} from 'hono';

import {appSessionUpstream, createMcpAuth} from 'mcp-auth-server';
import {createFetchHandler} from 'mcp-auth-server/lib/mcp.auth.fetch';
import {fromD1, sqliteStorage} from 'mcp-auth-server/lib/mcp.auth.sqlite';

const app = new Hono();

const build = (env, issuer) =>
	createMcpAuth({
		issuer,
		resource: `${issuer}/mcp`,
		signingKey: env.MCP_OAUTH_SIGNING_KEY,
		storage: sqliteStorage(fromD1(env.DB)),
		upstream: appSessionUpstream({
			getSignedInUser: (request) => {
				const id = /session=(\w+)/.exec(String(request.headers.cookie ?? ''))?.[1];
				return id ? {id, displayName: id} : null;
			},
			signInUrl: (returnTo) => `/login?returnTo=${encodeURIComponent(returnTo)}`
		}),
		loadActiveUser: (id) => ({id})
	});

app.all('*', async (c, next) => {
	const issuer = c.env.ISSUER;
	const auth = build(c.env, issuer);
	const response = await createFetchHandler(auth)(c.req.raw);
	if (response) return response;
	if ('/mcp' === new URL(c.req.url).pathname && 'POST' === c.req.method) {
		const body = await c.req.json().catch(() => undefined);
		const result = await auth.authenticate(Object.fromEntries(c.req.raw.headers), body);
		if (!('user' in result)) return c.json(result.body, result.status, result.headers);
		return c.json({jsonrpc: '2.0', id: body?.id ?? null, result: {hello: result.user.id}});
	}
	return next();
});

export default app;
