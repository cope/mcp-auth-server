'use strict';

/* eslint-disable sonarjs/no-hardcoded-ip */

import http from 'node:http';
import type {IncomingMessage} from 'node:http';
import type {AddressInfo} from 'node:net';
import {Readable} from 'node:stream';

import toNodeHttpRequest from '../../../src/adapters/node/to.node.http.request';
import type HttpRequestType from '../../../src/types/http.request.type';

describe('to.node.http.request tests', () => {
	let server: http.Server;
	let captured: HttpRequestType | undefined;
	let baseUrl: string;

	beforeAll(async () => {
		server = http.createServer(async (req, res) => {
			captured = await toNodeHttpRequest(req);
			res.end('ok');
		});
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
		baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
	});

	afterAll(async () => {
		await new Promise<void>((resolve) => server.close(() => resolve()));
	});

	it('should be defined', () => {
		expect(toNodeHttpRequest).toBeDefined();
		expect(typeof toNodeHttpRequest).toBe('function');
	});

	it('should convert a real GET request', async () => {
		await fetch(`${baseUrl}/path?a=1&a=2`, {headers: {'x-custom': 'v'}});

		expect(captured?.method).toBe('GET');
		expect(captured?.path).toBe('/path');
		expect(captured?.query).toEqual({a: ['1', '2']});
		expect(captured?.headers['x-custom']).toBe('v');
		expect(captured?.body).toBeUndefined();
		expect(captured?.ip).toMatch(/127\.0\.0\.1/);
	});

	it('should parse a real POST body', async () => {
		await fetch(`${baseUrl}/token`, {method: 'POST', headers: {'content-type': 'application/x-www-form-urlencoded'}, body: 'grant_type=refresh_token'});

		expect(captured?.method).toBe('POST');
		expect(captured?.body).toEqual({grant_type: 'refresh_token'});
	});

	it('should use the pre-parsed body when provided', async () => {
		const req = Object.assign(Readable.from([]), {url: '/x?q=1', method: 'POST', headers: {}, socket: {remoteAddress: '9.9.9.9'}}) as unknown as IncomingMessage;

		const parsed = await toNodeHttpRequest(req, {pre: true});

		expect(parsed).toEqual({method: 'POST', path: '/x', query: {q: '1'}, headers: {}, body: {pre: true}, ip: '9.9.9.9'});
	});

	it('should default method, url and ip', async () => {
		const req = Object.assign(Readable.from([]), {headers: {}}) as unknown as IncomingMessage;

		const parsed = await toNodeHttpRequest(req);

		expect(parsed).toEqual({method: 'GET', path: '/', query: {}, headers: {}, body: undefined, ip: undefined});
	});
});
