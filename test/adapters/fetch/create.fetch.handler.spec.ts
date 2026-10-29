'use strict';

import createFetchHandler from '../../../src/adapters/fetch/create.fetch.handler';
import type McpAuthType from '../../../src/types/mcp.auth.type';
import {createFakeAuth} from '../../helpers/handler.fixtures';

describe('create.fetch.handler tests', () => {
	it('should be defined', () => {
		expect(createFetchHandler).toBeDefined();
		expect(typeof createFetchHandler).toBe('function');
	});

	it('should return null for an unknown route', async () => {
		const auth = createFakeAuth();
		const handler = createFetchHandler(auth as unknown as McpAuthType<any>);

		const response = await handler(new Request('https://auth.test/unknown'));

		expect(response).toBeNull();
		expect(auth.handle).not.toHaveBeenCalled();
	});

	it('should return a Response for a known route', async () => {
		const auth = createFakeAuth();
		const handler = createFetchHandler(auth as unknown as McpAuthType<any>);

		const response = await handler(new Request('https://auth.test/known?a=1'));

		expect(response).toBeInstanceOf(Response);
		expect(response?.status).toBe(200);
		expect(response?.headers.get('x-test')).toBe('yes');
		expect(await response?.json()).toEqual({ok: true});
		expect(auth.handle).toHaveBeenCalledWith(expect.objectContaining({method: 'GET', path: '/known', query: {a: '1'}}));
	});
});
