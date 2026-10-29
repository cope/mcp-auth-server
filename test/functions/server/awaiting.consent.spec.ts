'use strict';

import awaitingConsent from '../../../src/functions/server/awaiting.consent';
import {buildContext, buildPending} from '../../helpers/server.fixtures';

const request = {method: 'POST', path: '/oauth/consent', query: {}, headers: {}};

describe('awaiting.consent tests', () => {
	it('should be defined', () => {
		expect(awaitingConsent).toBeDefined();
		expect(typeof awaitingConsent).toBe('function');
	});

	it('should return null without a state', async () => {
		const context = await buildContext();

		expect(await awaitingConsent(context, request, undefined)).toBeNull();
	});

	it('should return null for an unknown state', async () => {
		const context = await buildContext();

		expect(await awaitingConsent(context, request, 'nope')).toBeNull();
	});

	it('should return null for a pending authorization without a user', async () => {
		const context = await buildContext();
		await context.options.storage.savePendingAuthorization(buildPending());

		expect(await awaitingConsent(context, request, 'state-1')).toBeNull();
	});

	it('should return the pending authorization when no verifyUser is configured', async () => {
		const context = await buildContext();
		await context.options.storage.savePendingAuthorization(buildPending({userId: 'u1'}));

		expect((await awaitingConsent(context, request, 'state-1'))?.userId).toBe('u1');
	});

	it('should return the pending authorization when verifyUser accepts', async () => {
		const verifyUser = jest.fn(async () => true);
		const context = await buildContext({options: {upstream: {begin: jest.fn(), verifyUser}}});
		await context.options.storage.savePendingAuthorization(buildPending({userId: 'u1'}));

		expect((await awaitingConsent(context, request, 'state-1'))?.stateId).toBe('state-1');
		expect(verifyUser).toHaveBeenCalledWith(request, 'u1');
	});

	it('should return null when verifyUser rejects', async () => {
		const context = await buildContext({options: {upstream: {begin: jest.fn(), verifyUser: jest.fn(async () => false)}}});
		await context.options.storage.savePendingAuthorization(buildPending({userId: 'u1'}));

		expect(await awaitingConsent(context, request, 'state-1')).toBeNull();
	});
});
