# mcp-auth-server

OAuth 2.1 authorization server for MCP servers. It sits next to your app's existing users and SSO: MCP clients (Cursor, Claude Code, Codex, VS Code, MCP Inspector) sign in through your own identity provider, and your `/mcp` endpoint accepts only tokens this package issued.

The core is runtime-agnostic. It uses only web-standard APIs (`fetch`, `URL`, `crypto.subtle`, `crypto.getRandomValues`, `TextEncoder`) and `jose`. It has no `node:*` imports, no `Buffer`, and reads nothing from `process.env`. Node-only helpers live in `mcp.auth.node`.

## Supported MCP authorization spec versions

| Spec | Status |
| --- | --- |
| 2026-07-28 | Supported: Client ID Metadata Documents (SHOULD), `iss` in authorization responses (RFC 9207), per-request authentication without sessions |
| 2025-06-18 | Supported for existing clients through Dynamic Client Registration (`/register`, on by default) |

Standards implemented: RFC 6750, RFC 7009, RFC 7591, RFC 8414, RFC 8707, RFC 9207, RFC 9728, OAuth Client ID Metadata Document draft-00, PKCE (S256 only).

## Install

```bash
pnpm add mcp-auth-server
```

Frameworks and database drivers are optional peer dependencies. Install only the ones you use.

Entry points (deep imports from `lib`, like the other packages in this family):

| Import | Contents |
| --- | --- |
| `mcp-auth-server` | core: `createMcpAuth`, `oidcUpstream`, `appSessionUpstream`, types |
| `mcp-auth-server/lib/mcp.auth.fetch` | Fetch adapter (Bun, Deno, Workers, Hono, Next.js App Router, Remix, SvelteKit, Astro, Elysia, h3 v2) |
| `mcp-auth-server/lib/mcp.auth.node` | `node:http` adapter, Node SSRF guard |
| `mcp-auth-server/lib/mcp.auth.express` | Express middleware |
| `mcp-auth-server/lib/mcp.auth.fastify` | Fastify plugin |
| `mcp-auth-server/lib/mcp.auth.koa` | Koa middleware |
| `mcp-auth-server/lib/mcp.auth.memory` | in-memory storage |
| `mcp-auth-server/lib/mcp.auth.mongodb` | MongoDB storage |
| `mcp-auth-server/lib/mcp.auth.postgres` | Postgres storage (`pg`, `postgres.js`) |
| `mcp-auth-server/lib/mcp.auth.sqlite` | SQLite storage (`better-sqlite3`, `node:sqlite`, `bun:sqlite`, Cloudflare D1) |
| `mcp-auth-server/lib/mcp.auth.entra` | Entra ID preset |

## Quick start (Express)

```ts
import express from 'express';
import {createMcpAuth, oidcUpstream, signingKeyFromEnv} from 'mcp-auth-server';
import {expressMiddleware} from 'mcp-auth-server/lib/mcp.auth.express';
import {MemoryStorage} from 'mcp-auth-server/lib/mcp.auth.memory';

const auth = createMcpAuth({
	issuer: 'https://mcp.example.com',
	resource: 'https://mcp.example.com/mcp',
	signingKey: signingKeyFromEnv(process.env, 'MCP_OAUTH_SIGNING_KEY'),
	storage: new MemoryStorage(),
	upstream: oidcUpstream({discoveryUrl: 'https://idp.example.com/.well-known/openid-configuration', clientId: '...', clientSecret: '...'}),
	resolveUser: async (claims) => ({id: String(claims.sub), displayName: String(claims.name)}),
	loadActiveUser: async (id) => findActiveUser(id)
});

const app = express();
app.use(expressMiddleware(auth));
app.post('/mcp', express.json(), async (req, res) => {
	const result = await auth.authenticate(req.headers, req.body);
	if (!('user' in result)) return res.status(result.status).set(result.headers).json(result.body);
	res.json(await handleMcp(result.user, req.body));
});
```

Generate a signing key:

```bash
pnpm keygen
pnpm keygen --out mcp-signing-key.pem
```

`signingKey` accepts a `CryptoKey` or a PEM string (PKCS8 or PKCS1). `signingKeyFromEnv(env, name)` reads a PEM from an environment object and accepts literal `\n` newlines. Pass `verificationKey` when the signing `CryptoKey` is not extractable.

## Other frameworks

Fetch (Bun, Deno, Workers, Hono, Next.js App Router, Remix, SvelteKit, Astro, Elysia, h3 v2):

```ts
import {createFetchHandler} from 'mcp-auth-server/lib/mcp.auth.fetch';

const handle = createFetchHandler(auth);
export default {
	fetch: async (request: Request) => (await handle(request)) ?? mcpResponse(request)
};
```

`createFetchHandler` returns `null` for paths it does not own, so your own routes keep working.

Fastify:

```ts
import {fastifyPlugin} from 'mcp-auth-server/lib/mcp.auth.fastify';

await app.register(fastifyPlugin(auth));
```

Koa:

```ts
import {koaMiddleware} from 'mcp-auth-server/lib/mcp.auth.koa';

app.use(koaMiddleware(auth));
```

`node:http`:

```ts
import {createNodeHandler} from 'mcp-auth-server/lib/mcp.auth.node';

const handle = createNodeHandler(auth);
createServer(async (req, res) => {
	if (await handle(req, res)) return;
	res.writeHead(404).end();
});
```

All adapters read both JSON and `application/x-www-form-urlencoded` bodies (`/token`, `/revoke` and the consent POST are form-encoded). Express and Koa reuse a body already parsed by `express.json()`, `express.urlencoded()` or `koa-bodyparser`.

Hosts that mount routes themselves can use `auth.routes`, `auth.handle(request)` and the individual handlers with the plain-object contract `{method, path, query, headers, body, ip}` to `{status, headers, body}`.

### Recipes

- **NestJS**: Nest runs on Express or Fastify. Call `app.getHttpAdapter().getInstance()` and use `app.use(expressMiddleware(auth))` or `await instance.register(fastifyPlugin(auth))` before `app.listen`. Put your `/mcp` controller behind a guard that calls `auth.authenticate(req.headers, req.body)`.
- **Hono**: `app.all('*', async (c, next) => (await handle(c.req.raw)) ?? next())` with `handle = createFetchHandler(auth)`.
- **Next.js**: App Router: export `GET` and `POST` from catch-all route handlers that call `createFetchHandler(auth)`; mount the well-known routes at the root (see below). Pages Router: use `createNodeHandler(auth)` from an API route with `export const config = {api: {bodyParser: false}}`.

## Mounting and well-known paths

`issuer` and `resource` come from options only, never from request headers. If the issuer has a path (`https://example.com/auth`), the RFC 8414 metadata lives at `/.well-known/oauth-authorization-server/auth`. Hosts must mount the `/.well-known/*` routes at the origin root. The dispatcher serves the root and path forms.

## Hooks

| Hook | Purpose |
| --- | --- |
| `resolveUser(claims)` | Called after upstream sign-in with the validated id token claims. Create or update your user and return `{id, displayName?}`. Defaults to `{id: sub, displayName: name}`. |
| `loadActiveUser(id)` | Called on every `/mcp` request. Return `null` and the request fails with 401 `user_inactive`. |
| `renderConsent(model)` | Return HTML for the consent page. A default page is provided. |
| `rateLimit(key, route)` | Optional. Return `false` to answer 429. Called for `register`, `token` and `revoke` with the client IP as key. |
| `logger` | Optional `{info, warn, error}`. |

## Upstream login

OIDC (any provider, PKCE S256, id token validated with JWKS):

```ts
oidcUpstream({discoveryUrl, clientId, clientSecret, scope: 'openid profile email'});
```

Entra ID preset:

```ts
import {entraUpstream} from 'mcp-auth-server/lib/mcp.auth.entra';

entraUpstream({tenantId, clientId, clientSecret});
```

Set `callbackPath` (default `/oauth/callback`) to match the redirect URI registered at the provider, for example `/oauth/azure-callback`.

App session, for apps that already have their own login:

```ts
appSessionUpstream({
	getSignedInUser: async (request) => sessionUser(request.headers.cookie),
	signInUrl: (returnTo) => `/login?returnTo=${encodeURIComponent(returnTo)}`
});
```

At `/authorize`, a signed-in user goes straight to consent or the code. Otherwise the browser is sent to `signInUrl(returnTo)` where `returnTo` is always `{issuer}/oauth/resume?state=<stateId>` built by the package. `/oauth/resume` rechecks `getSignedInUser`, stores the user id on the pending authorization and continues exactly like the OIDC callback. The consent page and POST then require the same signed-in session, so the app cookie should be `SameSite=Lax` or stricter. The random `state` bound to the pending authorization protects the consent step against CSRF.

## Client registration

- **Client ID Metadata Documents** (recommended, advertised as `client_id_metadata_document_supported`): an `https` client_id URL with a path is fetched and validated (JSON with `client_id` equal to the URL, `client_name`, `redirect_uris`). The authorization request's `redirect_uri` must be listed. Responses are cached respecting `Cache-Control` up to `cimd.maxCacheSeconds`. Fetches use no redirects, a 5 s timeout and a 5 KiB limit by default. Private, loopback and link-local hosts are rejected for IP literals and internal names. On Node add DNS resolution checking: `cimd: {guard: nodeSsrfGuard}`. Inject `cimd.fetch` or `cimd.guard` on other runtimes. Use `cimd.trust: {allowHosts, denyHosts}` for a host policy (`*.example.com` patterns allowed). The consent page shows the client_id host next to the self-declared name. `private_key_jwt` client authentication is not supported; `token_endpoint_auth_method` stays `none`.
- **Dynamic Client Registration** (deprecated by the spec, kept for 2025-06-18 clients): `POST /register`, public clients only, `application_type` is accepted and stored. Turn off with `registration: {enabled: false}`.

Redirect URIs: `http://localhost` and `http://127.0.0.1` on any port, hosts from `redirects.httpsHosts`, schemes from `redirects.customSchemes` (`cursor://`, `vscode://`). Fragments are never allowed. `/authorize` and `/token` require an exact match.

## Storage

All five record types (clients, pending authorizations, authorization codes, refresh tokens, consents) go through one interface with atomic operations: `claimAuthorizationCode`, `claimRefreshToken`, `revokeRefreshTokenFamily`, `takePendingAuthorization`, `attachUserToPendingAuthorization`, `upsertConsent`, `deleteExpired`.

- **Memory**: `new MemoryStorage()`.
- **MongoDB**: `const storage = new MongoStorage(db, options); await storage.ensureIndexes();`. Defaults use the collection names `mcp_oauth_clients`, `mcp_oauth_pending_authorizations`, `mcp_oauth_authorization_codes`, `mcp_oauth_refresh_tokens`, `mcp_oauth_consents`, all configurable. `userIdField`, `userIdToDb` and `userIdFromDb` map an existing user key (for example a numeric `employeeId`) without a data migration. TTL indexes remove expired documents.
- **Postgres and SQLite** share one SQL implementation that takes an executor `(sql, params) => rows` instead of a driver: `postgresStorage(fromPg(pool))`, `postgresStorage(fromPostgresJs(sql))`, `sqliteStorage(fromBetterSqlite3(db))`, `sqliteStorage(fromNodeSqlite(db))`, `sqliteStorage(fromBunSqlite(db))`, `sqliteStorage(fromD1(env.DB))`. Create tables with `await storage.migrate()` or run `sql/postgres.sql` / `sql/sqlite.sql`. SQLite needs 3.35 or newer (`RETURNING`). Call `auth.deleteExpired()` on a schedule (cron, Workers cron trigger).

## Rate limits to apply

Apply these in your host or through the `rateLimit` hook:

| Route | Limit |
| --- | --- |
| `POST /register` | 20 per minute per IP |
| `POST /token`, `POST /revoke` | 60 per minute per IP |
| everything else | 200 per minute per IP |

## Security notes

- Authorization codes: 32 random bytes, only the SHA-256 hash is stored, 60 s TTL, single use (atomic claim before validation); client, redirect URI, PKCE verifier and resource are checked.
- Access tokens: RS256 JWT with `iss`, `aud` = resource, `sub`, `client_id`, `jti`, 1 h. Refresh tokens are opaque, stored as hashes, single use, rotate within the same family and absolute expiry (30 d). Replaying a used or revoked refresh token revokes the whole family.
- Public clients only: `/token` and `/revoke` answer 401 `invalid_client` when a secret or an `Authorization` header is sent.
- Every redirect to the client carries `iss` (RFC 9207), including errors. Unknown clients and unregistered redirect URIs never redirect.
- No MCP sessions: `auth.authenticate(headers, body)` validates every request on its own and never caches users. Signing keys are cached. A disabled user fails on the next request.
- Consent page: `X-Frame-Options: DENY`, strict CSP, `Cache-Control: no-store`, all values escaped.

## Scripts

Same as the other packages in this family: `pnpm all`, `build`, `clean`, `format`, `test`, `quick`, `integration`, `docs`, and so on.
