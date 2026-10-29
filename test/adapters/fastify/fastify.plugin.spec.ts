'use strict';

/* eslint-disable sonarjs/no-hardcoded-ip */

import Fastify from 'fastify';

import fastifyPlugin from '../../../src/adapters/fastify/fastify.plugin';
import type McpAuthType from '../../../src/types/mcp.auth.type';
import {createFakeAuth} from '../../helpers/handler.fixtures';
import type {FakeAuth} from '../../helpers/handler.fixtures';

describe('fastify.plugin tests', () => {
	let auth: FakeAuth;

	beforeEach(() => {
		auth = createFakeAuth();
	});

	it('should be defined', () => {
		expect(fastifyPlugin).toBeDefined();
		expect(typeof fastifyPlugin).toBe('function');
	});

	it('should register routes and forward status, headers and body', async () => {
		const app = Fastify();
		await app.register(fastifyPlugin(auth as unknown as McpAuthType<any>));

		const response = await app.inject({method: 'GET', url: '/known?a=1&a=2', headers: {'x-in': 'v'}, remoteAddress: '10.1.2.3'});

		expect(response.statusCode).toBe(200);
		expect(response.headers['x-test']).toBe('yes');
		expect(response.json()).toEqual({ok: true});
		expect(auth.handle).toHaveBeenCalledWith(expect.objectContaining({method: 'GET', path: '/known', query: {a: ['1', '2']}, ip: '10.1.2.3'}));
		expect(auth.handle.mock.calls[0][0].headers['x-in']).toBe('v');
		await app.close();
	});

	it('should add a form body parser when none exists', async () => {
		const app = Fastify();
		await app.register(fastifyPlugin(auth as unknown as McpAuthType<any>));

		const response = await app.inject({method: 'POST', url: '/known', headers: {'content-type': 'application/x-www-form-urlencoded'}, payload: 'grant_type=refresh_token&x=1'});

		expect(response.statusCode).toBe(200);
		expect(auth.handle).toHaveBeenCalledWith(expect.objectContaining({method: 'POST', body: {grant_type: 'refresh_token', x: '1'}}));
		await app.close();
	});

	it('should not re-add the form body parser when one is already registered', async () => {
		const app = Fastify();
		const custom = jest.fn((_request: unknown, body: unknown, done: (error: Error | null, value?: unknown) => void) => done(null, {custom: body}));
		app.addContentTypeParser('application/x-www-form-urlencoded', {parseAs: 'string'}, custom);
		const addSpy = jest.spyOn(app, 'addContentTypeParser');
		await app.register(fastifyPlugin(auth as unknown as McpAuthType<any>));

		await app.inject({method: 'POST', url: '/known', headers: {'content-type': 'application/x-www-form-urlencoded'}, payload: 'a=1'});

		expect(addSpy).not.toHaveBeenCalled();
		expect(custom).toHaveBeenCalledTimes(1);
		expect(auth.handle).toHaveBeenCalledWith(expect.objectContaining({body: {custom: 'a=1'}}));
		await app.close();
	});

	it('should forward non-200 statuses and empty bodies', async () => {
		const redirecting = createFakeAuth({status: 302, headers: {location: 'https://a.test/'}});
		const app = Fastify();
		await app.register(fastifyPlugin(redirecting as unknown as McpAuthType<any>));

		const response = await app.inject({method: 'GET', url: '/known'});

		expect(response.statusCode).toBe(302);
		expect(response.headers.location).toBe('https://a.test/');
		expect(response.body).toBe('');
		await app.close();
	});
});
