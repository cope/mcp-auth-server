'use strict';

import {createServer} from 'node:http';
import type {AddressInfo} from 'node:net';
import type {Server} from 'node:http';

import express from 'express';
import Fastify from 'fastify';
import Koa from 'koa';
import createFetchHandler from '../../src/adapters/fetch/create.fetch.handler';
import expressMiddleware from '../../src/adapters/express/express.middleware';
import fastifyPlugin from '../../src/adapters/fastify/fastify.plugin';
import koaMiddleware from '../../src/adapters/koa/koa.middleware';
import createNodeHandler from '../../src/adapters/node/create.node.handler';
import readNodeBody from '../../src/adapters/node/read.node.body';
import {parseBody} from '../../src/mcp.auth.server';
import type {McpAuthType} from '../../src/mcp.auth.server';
import {makeApp} from '../helpers/app';
import type {FlowContext, Send, Sent} from '../helpers/flow';
import {runFullFlow} from '../helpers/flow';

type Kind = 'oidc' | 'session';
type Harness = {context: FlowContext; close: () => Promise<void>};

const toSent = async (response: Response): Promise<Sent> => {
	const text = await response.text();
	const headers: Record<string, string> = Object.fromEntries(response.headers.entries());
	let body: any;
	try {
		body = JSON.parse(text);
	} catch {
		body = undefined;
	}
	return {status: response.status, headers, body, text};
};

const buildInit = (request: Parameters<Send>[0]): RequestInit => {
	const headers: Record<string, string> = {...request.headers};
	let body: string | undefined;
	if (request.form) {
		headers['content-type'] = 'application/x-www-form-urlencoded';
		body = new URLSearchParams(request.form).toString();
	} else if (undefined !== request.json) {
		headers['content-type'] = 'application/json';
		body = JSON.stringify(request.json);
	}
	return {method: request.method, headers, body, redirect: 'manual'};
};

const freePort = async (): Promise<number> => {
	const probe = createServer();
	const port = await listen(probe);
	await closeServer(probe);
	return port;
};

const mcpResponse = async (auth: McpAuthType<any>, headers: Record<string, any>, body: unknown): Promise<{status: number; headers: Record<string, string>; body: unknown}> => {
	const result = await auth.authenticate(headers, body);
	return 'user' in result
		? {status: 200, headers: {'content-type': 'application/json'}, body: {userId: result.user.id}}
		: {status: result.status, headers: result.headers, body: result.body};
};

type Mount = (auth: McpAuthType<any>, port: number) => Promise<() => Promise<void>>;

const httpHarness = async (kind: Kind, mount: Mount): Promise<Harness> => {
	const port = await freePort();
	const base = `http://127.0.0.1:${port}`;
	const app = await makeApp(kind, {}, base);
	const close = await mount(app.auth, port);

	const send: Send = async (request) => toSent(await fetch(request.url, buildInit(request)));
	const mcp = async (headers: Record<string, string>): Promise<Sent> =>
		toSent(
			await fetch(`${base}/mcp`, {method: 'POST', headers: {'content-type': 'application/json', ...headers}, body: JSON.stringify({jsonrpc: '2.0', id: 7, method: 'ping'})})
		);
	return {context: {...app.context, registration: 'dcr', send, mcp}, close};
};

function listen(server: Server, port = 0): Promise<number> {
	return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve((server.address() as AddressInfo).port)));
}

function closeServer(server: Server): Promise<void> {
	return new Promise((resolve) => server.close(() => resolve()));
}

const nodeHarness = (kind: Kind): Promise<Harness> =>
	httpHarness(kind, async (auth, port) => {
		const handler = createNodeHandler(auth);
		const server: Server = createServer(async (req, res) => {
			if (await handler(req, res)) return;
			if ('/mcp' === req.url) {
				const result = await mcpResponse(auth, req.headers, parseBody(req.headers['content-type'], await readNodeBody(req)));
				res.writeHead(result.status, result.headers).end(JSON.stringify(result.body));
				return;
			}
			res.writeHead(404).end();
		});
		await listen(server, port);
		return () => closeServer(server);
	});

const expressHarness = (kind: Kind, withParsers: boolean): Promise<Harness> =>
	httpHarness(kind, async (auth, port) => {
		const app = express();
		if (withParsers) app.use(express.json(), express.urlencoded({extended: false}));
		app.use(expressMiddleware(auth));
		app.post('/mcp', express.json(), async (req, res) => {
			const result = await mcpResponse(auth, req.headers, req.body);
			res.status(result.status).set(result.headers).send(result.body);
		});
		const server = createServer(app);
		await listen(server, port);
		return () => closeServer(server);
	});

const fastifyHarness = (kind: Kind): Promise<Harness> =>
	httpHarness(kind, async (auth, port) => {
		const app = Fastify();
		await app.register(fastifyPlugin(auth));
		app.post('/mcp', async (request, reply) => {
			const result = await mcpResponse(auth, request.headers, request.body);
			return reply.status(result.status).headers(result.headers).send(result.body);
		});
		await app.listen({port, host: '127.0.0.1'});
		return () => app.close();
	});

const koaHarness = (kind: Kind): Promise<Harness> =>
	httpHarness(kind, async (auth, port) => {
		const app = new Koa();
		app.use(koaMiddleware(auth));
		app.use(async (ctx) => {
			if ('/mcp' !== ctx.path) {
				ctx.status = 404;
				return;
			}
			const result = await mcpResponse(auth, ctx.headers, parseBody(ctx.headers['content-type'], await readNodeBody(ctx.req)));
			ctx.status = result.status;
			ctx.set(result.headers);
			ctx.body = result.body;
		});
		const server = createServer(app.callback());
		await listen(server, port);
		return () => closeServer(server);
	});

const fetchHarness = async (kind: Kind): Promise<Harness> => {
	const base = 'https://fetch.test';
	const app = await makeApp(kind, {}, base);
	const handler = createFetchHandler(app.auth);
	const dispatch = async (request: Request): Promise<Response> => {
		const routed = await handler(request.clone());
		if (routed) return routed;
		const result = await mcpResponse(app.auth, Object.fromEntries(request.headers), await request.json().catch(() => undefined));
		return new Response(JSON.stringify(result.body), {status: result.status, headers: result.headers});
	};
	const send: Send = async (request) => toSent(await dispatch(new Request(request.url, buildInit(request))));
	const mcp = async (headers: Record<string, string>): Promise<Sent> =>
		toSent(
			await dispatch(new Request(`${base}/mcp`, {method: 'POST', headers: {'content-type': 'application/json', ...headers}, body: JSON.stringify({jsonrpc: '2.0', id: 7})}))
		);
	return {context: {...app.context, registration: 'dcr', send, mcp}, close: async () => undefined};
};

const adapters: [string, (kind: Kind) => Promise<Harness>][] = [
	['fetch', fetchHarness],
	['node:http', nodeHarness],
	['express (no body parser)', (kind) => expressHarness(kind, false)],
	['express (json + urlencoded parsers)', (kind) => expressHarness(kind, true)],
	['fastify', fastifyHarness],
	['koa', koaHarness]
];

describe.each(adapters)('%s adapter', (_name, make) => {
	const closers: (() => Promise<void>)[] = [];
	afterAll(async () => {
		await Promise.all(closers.map((close) => close()));
	});

	it.each([['oidc'], ['session']] as const)('runs the full flow with the %s upstream (DCR)', async (kind) => {
		const harness = await make(kind);
		closers.push(harness.close);
		await expect(runFullFlow(harness.context)).resolves.toBeUndefined();
	});

	it('runs the full flow with CIMD and the oidc upstream', async () => {
		const harness = await make('oidc');
		closers.push(harness.close);
		await expect(runFullFlow({...harness.context, registration: 'cimd'})).resolves.toBeUndefined();
	});
});
