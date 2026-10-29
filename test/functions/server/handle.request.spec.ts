'use strict';

import handleRequest from '../../../src/functions/server/handle.request';
import type RouteNameType from '../../../src/types/route.name.type';
import type RouteType from '../../../src/types/route.type';
import {buildContext} from '../../helpers/server.fixtures';

const handler = jest.fn(async () => ({status: 200, headers: {}, body: 'handled'}));
const routeFor = (name: RouteNameType, path: string): RouteType => ({method: 'POST', path, name, handler});
const routes: RouteType[] = [routeFor('token', '/token'), routeFor('register', '/register'), routeFor('revoke', '/revoke'), routeFor('authorize', '/authorize')];
const requestFor = (path: string, ip?: string) => ({method: 'POST', path, query: {}, headers: {}, ip});

describe('handle.request tests', () => {
	it('should be defined', () => {
		expect(handleRequest).toBeDefined();
		expect(typeof handleRequest).toBe('function');
	});

	it('should return 404 for an unknown route', async () => {
		const context = await buildContext();

		const response = await handleRequest(context, routes, requestFor('/nope'));

		expect(response.status).toBe(404);
		expect(response.body).toEqual({error: 'not_found'});
		expect(handler).not.toHaveBeenCalled();
	});

	it('should delegate to the handler when no rate limit is configured', async () => {
		const context = await buildContext();
		const request = requestFor('/token');

		const response = await handleRequest(context, routes, request);

		expect(response.body).toBe('handled');
		expect(handler).toHaveBeenCalledWith(request);
	});

	it.each(['token', 'register', 'revoke'])('should consult the rate limit for %s and allow', async (name: string) => {
		const rateLimit = jest.fn(async () => true);
		const context = await buildContext({options: {rateLimit}});

		const response = await handleRequest(context, routes, requestFor(`/${name}`, 'client-ip'));

		expect(rateLimit).toHaveBeenCalledWith('client-ip', name);
		expect(response.body).toBe('handled');
	});

	it('should answer 429 with retry-after when the rate limit denies', async () => {
		const context = await buildContext({options: {rateLimit: jest.fn(() => false)}});

		const response = await handleRequest(context, routes, requestFor('/token', 'client-ip'));

		expect(response.status).toBe(429);
		expect(response.headers['retry-after']).toBe('60');
		expect(response.body).toEqual({error: 'rate_limited', error_description: 'too many requests'});
		expect(handler).not.toHaveBeenCalled();
	});

	it('should use the key unknown when the ip is missing', async () => {
		const rateLimit = jest.fn(async () => true);
		const context = await buildContext({options: {rateLimit}});

		await handleRequest(context, routes, requestFor('/token'));

		expect(rateLimit).toHaveBeenCalledWith('unknown', 'token');
	});

	it('should skip the rate limit for routes that are not limited', async () => {
		const rateLimit = jest.fn(async () => false);
		const context = await buildContext({options: {rateLimit}});

		const response = await handleRequest(context, routes, requestFor('/authorize'));

		expect(rateLimit).not.toHaveBeenCalled();
		expect(response.body).toBe('handled');
	});
});
