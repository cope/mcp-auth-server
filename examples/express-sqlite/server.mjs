import {DatabaseSync} from 'node:sqlite';

import express from 'express';

import {appSessionUpstream, createMcpAuth, signingKeyFromEnv} from 'mcp-auth-server';
import {expressMiddleware} from 'mcp-auth-server/lib/mcp.auth.express';
import {fromNodeSqlite, sqliteStorage} from 'mcp-auth-server/lib/mcp.auth.sqlite';
import {nodeSsrfGuard} from 'mcp-auth-server/lib/mcp.auth.node';

const port = Number(process.env.PORT ?? 3000);
const issuer = process.env.ISSUER ?? `http://localhost:${port}`;

const storage = sqliteStorage(fromNodeSqlite(new DatabaseSync('mcp-auth.db')));
await storage.migrate();

const sessions = new Map();

const auth = createMcpAuth({
	issuer,
	resource: `${issuer}/mcp`,
	signingKey: signingKeyFromEnv(process.env, 'MCP_OAUTH_SIGNING_KEY'),
	storage,
	productName: 'Example MCP',
	redirects: {customSchemes: ['cursor://', 'vscode://']},
	cimd: {guard: nodeSsrfGuard},
	upstream: appSessionUpstream({
		getSignedInUser: (request) => {
			const id = /session=(\w+)/.exec(String(request.headers.cookie ?? ''))?.[1];
			return id && sessions.has(id) ? {id, displayName: sessions.get(id)} : null;
		},
		signInUrl: (returnTo) => `/login?returnTo=${encodeURIComponent(returnTo)}`
	}),
	loadActiveUser: (id) => (sessions.has(id) ? {id, name: sessions.get(id)} : null)
});

const app = express();

app.get('/login', (req, res) => {
	res.type('html').send(`<form method="post" action="/login"><input type="hidden" name="returnTo" value="${String(req.query.returnTo ?? '/').replaceAll('"', '&quot;')}"><input name="name" placeholder="your name" required><button>Sign in</button></form>`);
});

app.post('/login', express.urlencoded({extended: false}), (req, res) => {
	const id = String(req.body.name).replace(/\W/g, '').toLowerCase() || 'user';
	sessions.set(id, String(req.body.name));
	res.cookie('session', id, {httpOnly: true, sameSite: 'lax'});
	const returnTo = String(req.body.returnTo);
	res.redirect(returnTo.startsWith(issuer) ? returnTo : '/');
});

app.use(expressMiddleware(auth));

app.post('/mcp', express.json(), async (req, res) => {
	const result = await auth.authenticate(req.headers, req.body);
	if (!('user' in result)) return res.status(result.status).set(result.headers).json(result.body);
	res.json({jsonrpc: '2.0', id: req.body?.id ?? null, result: {hello: result.user.name}});
});

setInterval(() => auth.deleteExpired(), 60_000).unref();

app.listen(port, () => console.log(`MCP at ${issuer}/mcp`));
