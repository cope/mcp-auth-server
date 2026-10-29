'use strict';

import challengeResponse from '../../../src/functions/server/challenge.response';
import {buildContext} from '../../helpers/server.fixtures';

describe('challenge.response tests', () => {
	it('should be defined', () => {
		expect(challengeResponse).toBeDefined();
		expect(typeof challengeResponse).toBe('function');
	});

	it('should omit the error attribute when no token was sent', async () => {
		const context = await buildContext();

		const result = challengeResponse(context, undefined, false, 'missing_token') as any;

		expect(result.status).toBe(401);
		expect(result.reason).toBe('missing_token');
		expect(result.headers['www-authenticate']).toBe(`Bearer resource_metadata="${context.resourceMetadataUrl}"`);
		expect(result.headers['content-type']).toBe('application/json');
		expect(result.body).toEqual({jsonrpc: '2.0', id: null, error: {code: -32000, message: 'Authentication Required'}});
	});

	it('should add error="invalid_token" when a token was sent', async () => {
		const context = await buildContext();

		const result = challengeResponse(context, null, true, 'expired') as any;

		expect(result.headers['www-authenticate']).toBe(`Bearer error="invalid_token", resource_metadata="${context.resourceMetadataUrl}"`);
	});

	it('should echo the id from an object body', async () => {
		const context = await buildContext();

		expect((challengeResponse(context, {id: 7}, true, 'x') as any).body.id).toBe(7);
	});

	it('should use null when the object body has no id', async () => {
		const context = await buildContext();

		expect((challengeResponse(context, {}, true, 'x') as any).body.id).toBeNull();
	});

	it('should use null for array, null and primitive bodies', async () => {
		const context = await buildContext();

		expect((challengeResponse(context, [{id: 1}], true, 'x') as any).body.id).toBeNull();
		expect((challengeResponse(context, null, true, 'x') as any).body.id).toBeNull();
		expect((challengeResponse(context, 'text', true, 'x') as any).body.id).toBeNull();
	});
});
