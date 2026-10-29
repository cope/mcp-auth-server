'use strict';

import type {Request, Response} from 'express';
import express from 'express';
import {Readable} from 'node:stream';

import expressMiddleware from '../../../src/adapters/express/express.middleware';
import type McpAuthType from '../../../src/types/mcp.auth.type';
import {createFakeAuth, startServer} from '../../helpers/handler.fixtures';
import type {FakeAuth, RunningServer} from '../../helpers/handler.fixtures';

describe('express.middleware tests', () => {
	let auth: FakeAuth;
	let running: RunningServer | undefined;

	const serve = async (configure: (app: express.Express) => void): Promise<string> => {
		const app = express();
		configure(app);
		app.use((_req, res) => {
			res.status(404).send('fell through');
		});
		running = await startServer(app);
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
		expect(expressMiddleware).toBeDefined();
		expect(typeof expressMiddleware).toBe('function');
	});

	it('should call next for an unknown route', async () => {
		const baseUrl = await serve((app) => app.use(expressMiddleware(auth as unknown as McpAuthType<any>)));

		const response = await fetch(`${baseUrl}/unknown`);

		expect(response.status).toBe(404);
		expect(await response.text()).toBe('fell through');
		expect(auth.handle).not.toHaveBeenCalled();
	});

	it('should handle a known GET route and write the response', async () => {
		const baseUrl = await serve((app) => app.use(expressMiddleware(auth as unknown as McpAuthType<any>)));

		const response = await fetch(`${baseUrl}/known?a=1`);

		expect(response.status).toBe(200);
		expect(response.headers.get('x-test')).toBe('yes');
		expect(await response.json()).toEqual({ok: true});
		expect(auth.handle).toHaveBeenCalledWith(expect.objectContaining({method: 'GET', path: '/known', query: {a: '1'}, body: undefined}));
	});

	it('should read the stream when no body parser ran', async () => {
		const baseUrl = await serve((app) => app.use(expressMiddleware(auth as unknown as McpAuthType<any>)));

		await fetch(`${baseUrl}/known`, {method: 'POST', headers: {'content-type': 'application/x-www-form-urlencoded'}, body: 'grant_type=refresh_token'});

		expect(auth.handle).toHaveBeenCalledWith(expect.objectContaining({method: 'POST', body: {grant_type: 'refresh_token'}}));
	});

	it('should use a pre-parsed non-empty body', async () => {
		const baseUrl = await serve((app) => {
			app.use(express.urlencoded({extended: false}));
			app.use(expressMiddleware(auth as unknown as McpAuthType<any>));
		});

		await fetch(`${baseUrl}/known`, {method: 'POST', headers: {'content-type': 'application/x-www-form-urlencoded'}, body: 'a=1&b=2'});

		expect(auth.handle).toHaveBeenCalledWith(expect.objectContaining({body: {a: '1', b: '2'}}));
	});

	it('should fall back to the stream when the pre-parsed body is an empty object', async () => {
		const baseUrl = await serve((app) => {
			app.use(express.urlencoded({extended: false}));
			app.use(expressMiddleware(auth as unknown as McpAuthType<any>));
		});

		await fetch(`${baseUrl}/known`, {method: 'POST', headers: {'content-type': 'application/x-www-form-urlencoded'}, body: ''});

		expect(auth.handle).toHaveBeenCalledWith(expect.objectContaining({method: 'POST', body: undefined}));
	});

	it('should fall back to the stream when the pre-parsed body is not an object', async () => {
		const baseUrl = await serve((app) => {
			app.use(express.text({type: 'text/plain'}));
			app.use(expressMiddleware(auth as unknown as McpAuthType<any>));
		});

		await fetch(`${baseUrl}/known`, {method: 'POST', headers: {'content-type': 'text/plain'}, body: 'plain'});

		expect(auth.handle).toHaveBeenCalledWith(expect.objectContaining({method: 'POST', body: undefined}));
	});

	it('should resolve the route from originalUrl when mounted under a prefix', async () => {
		auth.hasRoute.mockImplementation((request: {path: string}) => '/prefix/known' === request.path);
		const baseUrl = await serve((app) => app.use('/prefix', expressMiddleware(auth as unknown as McpAuthType<any>)));

		const response = await fetch(`${baseUrl}/prefix/known`);

		expect(response.status).toBe(200);
		expect(auth.handle).toHaveBeenCalledWith(expect.objectContaining({path: '/prefix/known'}));
	});

	it('should forward errors to next', async () => {
		auth.handle.mockRejectedValueOnce(new Error('handler failed'));
		const errorHandler = jest.fn((error: Error, _req: Request, res: Response, _next: () => void) => {
			res.status(500).send(error.message);
		});
		const baseUrl = await serve((app) => {
			app.use(expressMiddleware(auth as unknown as McpAuthType<any>));
			app.use(errorHandler as unknown as express.ErrorRequestHandler);
		});

		const response = await fetch(`${baseUrl}/known`);

		expect(response.status).toBe(500);
		expect(await response.text()).toBe('handler failed');
	});

	it('should fall back to req.url when originalUrl is missing', async () => {
		const req = Object.assign(Readable.from([]), {method: 'GET', url: '/known', headers: {}}) as unknown as Request;
		const res = {writeHead: jest.fn(), end: jest.fn()} as unknown as Response;
		const next = jest.fn();

		await expressMiddleware(auth as unknown as McpAuthType<any>)(req, res, next);

		expect(next).not.toHaveBeenCalled();
		expect(res.end).toHaveBeenCalledWith('{"ok":true}');
	});
});
