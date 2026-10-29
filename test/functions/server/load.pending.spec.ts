'use strict';

import loadPending from '../../../src/functions/server/load.pending';
import {buildContext, buildPending} from '../../helpers/server.fixtures';

const requestWith = (state?: string) => ({method: 'GET', path: '/oauth/consent', query: {state}, headers: {}});

describe('load.pending tests', () => {
	it('should be defined', () => {
		expect(loadPending).toBeDefined();
		expect(typeof loadPending).toBe('function');
	});

	it('should return null without a state', async () => {
		const context = await buildContext();

		expect(await loadPending(context, requestWith())).toBeNull();
	});

	it('should return null for an unknown state', async () => {
		const context = await buildContext();

		expect(await loadPending(context, requestWith('nope'))).toBeNull();
	});

	it('should return null when the pending authorization already has a user', async () => {
		const context = await buildContext();
		await context.options.storage.savePendingAuthorization(buildPending({userId: 'u1'}));

		expect(await loadPending(context, requestWith('state-1'))).toBeNull();
	});

	it('should return the pending authorization without a user', async () => {
		const context = await buildContext();
		const pending = buildPending();
		await context.options.storage.savePendingAuthorization(pending);

		expect(await loadPending(context, requestWith('state-1'))).toEqual(pending);
	});

	it('should return null for an expired pending authorization', async () => {
		const context = await buildContext();
		await context.options.storage.savePendingAuthorization(buildPending({expiresAt: new Date(0)}));

		expect(await loadPending(context, requestWith('state-1'))).toBeNull();
	});
});
