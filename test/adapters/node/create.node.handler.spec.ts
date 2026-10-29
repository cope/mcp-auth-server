'use strict';

import type {IncomingMessage, ServerResponse} from 'node:http';
import {Readable} from 'node:stream';

import createNodeHandler from '../../../src/adapters/node/create.node.handler';
import type McpAuthType from '../../../src/types/mcp.auth.type';
import {createFakeAuth} from '../../helpers/handler.fixtures';

describe('create.node.handler tests', () => {
	const fakeRequest = (url: string | undefined, method: string | undefined): IncomingMessage =>
		Object.assign(Readable.from([]), {url, method, headers: {}}) as unknown as IncomingMessage;
	const fakeResponse = () => {
		const res = {writeHead: jest.fn(), end: jest.fn()};
		return {res, asServerResponse: res as unknown as ServerResponse};
	};

	it('should be defined', () => {
		expect(createNodeHandler).toBeDefined();
		expect(typeof createNodeHandler).toBe('function');
	});

	it('should return false for an unknown route without writing', async () => {
		const auth = createFakeAuth();
		const {res, asServerResponse} = fakeResponse();

		const handled = await createNodeHandler(auth as unknown as McpAuthType<any>)(fakeRequest('/unknown', 'GET'), asServerResponse);

		expect(handled).toBe(false);
		expect(res.writeHead).not.toHaveBeenCalled();
	});

	it('should write the response and return true for a known route', async () => {
		const auth = createFakeAuth();
		const {res, asServerResponse} = fakeResponse();

		const handled = await createNodeHandler(auth as unknown as McpAuthType<any>)(fakeRequest('/known?x=1', 'GET'), asServerResponse);

		expect(handled).toBe(true);
		expect(res.writeHead).toHaveBeenCalledWith(200, {'content-type': 'application/json', 'x-test': 'yes'});
		expect(res.end).toHaveBeenCalledWith('{"ok":true}');
	});

	it('should default the method to GET and the url to the root', async () => {
		const auth = createFakeAuth();
		const {asServerResponse} = fakeResponse();

		const handled = await createNodeHandler(auth as unknown as McpAuthType<any>)(fakeRequest(undefined, undefined), asServerResponse);

		expect(handled).toBe(false);
		expect(auth.hasRoute).toHaveBeenCalledWith({method: 'GET', path: '/', query: {}, headers: {}});
	});
});
