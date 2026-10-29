'use strict';

import Koa from 'koa';

import koaMiddleware from '../../../src/adapters/koa/koa.middleware';
import type McpAuthType from '../../../src/types/mcp.auth.type';
import {createFakeAuth, startServer} from '../../helpers/handler.fixtures';
import type {FakeAuth, RunningServer} from '../../helpers/handler.fixtures';

describe('koa.middleware tests', () => {
	let auth: FakeAuth;
	let running: RunningServer | undefined;

	const serve = async (configure: (app: Koa) => void): Promise<string> => {
		const app = new Koa();
		configure(app);
		app.use(async (ctx) => {
			ctx.status = 404;
			ctx.body = 'fell through';
		});
		running = await startServer(app.callback());
		return running.baseUrl;
	};

	beforeEach(() => {
		auth = createFakeAuth();
	});

	afterEach(async () => {
		await running?.close();
		running = undefined;
	});

	it('should be defined', () => {
		expect(koaMiddleware).toBeDefined();
		expect(typeof koaMiddleware).toBe('function');
	});

	it('should call next for an unknown route', async () => {
		const baseUrl = await serve((app) => app.use(koaMiddleware(auth as unknown as McpAuthType<any>)));

		const response = await fetch(`${baseUrl}/unknown`);

		expect(response.status).toBe(404);
		expect(await response.text()).toBe('fell through');
		expect(auth.handle).not.toHaveBeenCalled();
	});

	it('should handle a known GET route and write status, headers and body', async () => {
		const baseUrl = await serve((app) => app.use(koaMiddleware(auth as unknown as McpAuthType<any>)));

		const response = await fetch(`${baseUrl}/known?a=1`);

		expect(response.status).toBe(200);
		expect(response.headers.get('x-test')).toBe('yes');
		expect(await response.json()).toEqual({ok: true});
		expect(auth.handle).toHaveBeenCalledWith(expect.objectContaining({method: 'GET', path: '/known', query: {a: '1'}}));
	});

	it('should read the stream when no body parser ran', async () => {
		const baseUrl = await serve((app) => app.use(koaMiddleware(auth as unknown as McpAuthType<any>)));

		await fetch(`${baseUrl}/known`, {method: 'POST', headers: {'content-type': 'application/x-www-form-urlencoded'}, body: 'a=1'});

		expect(auth.handle).toHaveBeenCalledWith(expect.objectContaining({method: 'POST', body: {a: '1'}}));
	});

	it('should use a pre-parsed ctx.request.body', async () => {
		const baseUrl = await serve((app) => {
			app.use(async (ctx, next) => {
				(ctx.request as {body?: unknown}).body = {pre: 'parsed'};
				await next();
			});
			app.use(koaMiddleware(auth as unknown as McpAuthType<any>));
		});

		await fetch(`${baseUrl}/known`, {method: 'POST', headers: {'content-type': 'application/json'}, body: '{"raw":true}'});

		expect(auth.handle).toHaveBeenCalledWith(expect.objectContaining({body: {pre: 'parsed'}}));
	});

	it('should ignore an empty pre-parsed body and read the stream', async () => {
		const baseUrl = await serve((app) => {
			app.use(async (ctx, next) => {
				(ctx.request as {body?: unknown}).body = {};
				await next();
			});
			app.use(koaMiddleware(auth as unknown as McpAuthType<any>));
		});

		await fetch(`${baseUrl}/known`, {method: 'POST', headers: {'content-type': 'application/json'}, body: '{"raw":true}'});

		expect(auth.handle).toHaveBeenCalledWith(expect.objectContaining({body: {raw: true}}));
	});

	it('should ignore a non-object pre-parsed body', async () => {
		const baseUrl = await serve((app) => {
			app.use(async (ctx, next) => {
				(ctx.request as {body?: unknown}).body = 'text';
				await next();
			});
			app.use(koaMiddleware(auth as unknown as McpAuthType<any>));
		});

		await fetch(`${baseUrl}/known`, {method: 'POST', headers: {'content-type': 'application/json'}, body: '{"raw":true}'});

		expect(auth.handle).toHaveBeenCalledWith(expect.objectContaining({body: {raw: true}}));
	});

	it('should answer an empty body when the response body is undefined', async () => {
		const redirecting = createFakeAuth({status: 302, headers: {location: 'https://a.test/'}});
		const baseUrl = await serve((app) => app.use(koaMiddleware(redirecting as unknown as McpAuthType<any>)));

		const response = await fetch(`${baseUrl}/known`, {redirect: 'manual'});

		expect(response.status).toBe(302);
		expect(response.headers.get('location')).toBe('https://a.test/');
		expect(await response.text()).toBe('');
	});
});
