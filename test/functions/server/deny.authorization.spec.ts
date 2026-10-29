'use strict';

import denyAuthorization from '../../../src/functions/server/deny.authorization';
import {buildContext, buildPending, issuerUrl} from '../../helpers/server.fixtures';

describe('deny.authorization tests', () => {
	it('should be defined', () => {
		expect(denyAuthorization).toBeDefined();
		expect(typeof denyAuthorization).toBe('function');
	});

	it('should delete the pending authorization and redirect with access_denied', async () => {
		const context = await buildContext();
		const pending = buildPending();
		await context.options.storage.savePendingAuthorization(pending);

		const response = await denyAuthorization(context, pending);

		const location = new URL(response.headers.location);
		expect(response.status).toBe(302);
		expect(location.origin + location.pathname).toBe('https://client.example.com/cb');
		expect(location.searchParams.get('error')).toBe('access_denied');
		expect(location.searchParams.get('error_description')).toBe('sign-in failed');
		expect(location.searchParams.get('state')).toBe('client-state');
		expect(location.searchParams.get('iss')).toBe(issuerUrl);
		expect(await context.options.storage.getPendingAuthorization('state-1', new Date(0))).toBeNull();
	});

	it('should use a custom description', async () => {
		const context = await buildContext();

		const response = await denyAuthorization(context, buildPending(), 'user said no');

		expect(new URL(response.headers.location).searchParams.get('error_description')).toBe('user said no');
	});
});
