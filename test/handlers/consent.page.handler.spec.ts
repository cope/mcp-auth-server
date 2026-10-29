'use strict';

import consentPageHandler from '../../src/handlers/consent.page.handler';
import {buildFixture, buildRequest, seedPending, stateRequest} from '../helpers/handler.fixtures';
import type {Fixture} from '../helpers/handler.fixtures';

describe('consent.page.handler tests', () => {
	let fixture: Fixture;

	beforeEach(async () => {
		fixture = await buildFixture();
		await seedPending(fixture.storage, {userId: 'user-1', userDisplayName: 'User One'});
	});

	it('should be defined', () => {
		expect(consentPageHandler).toBeDefined();
		expect(typeof consentPageHandler).toBe('function');
	});

	it('should answer 400 for an unknown state', async () => {
		const response = await consentPageHandler(fixture.context, stateRequest('missing'));

		expect(response.status).toBe(400);
		expect(fixture.renderConsent).not.toHaveBeenCalled();
	});

	it('should answer 400 when the query has no state', async () => {
		const response = await consentPageHandler(fixture.context, buildRequest());

		expect(response.status).toBe(400);
	});

	it('should answer 400 when the pending authorization has no user', async () => {
		await seedPending(fixture.storage, {stateId: 'anonymous'});

		const response = await consentPageHandler(fixture.context, stateRequest('anonymous'));

		expect(response.status).toBe(400);
	});

	it('should answer 400 when verifyUser rejects the user', async () => {
		fixture.upstream.verifyUser.mockResolvedValueOnce(false);

		const response = await consentPageHandler(fixture.context, stateRequest());

		expect(response.status).toBe(400);
		expect(fixture.upstream.verifyUser).toHaveBeenCalledWith(expect.objectContaining({query: {state: 'state-1'}}), 'user-1');
	});

	it('should render the consent page with hardened headers', async () => {
		const response = await consentPageHandler(fixture.context, stateRequest());

		expect(response.status).toBe(200);
		expect(response.body).toBe('<html>consent</html>');
		expect(response.headers['content-type']).toBe('text/html; charset=utf-8');
		expect(response.headers['x-frame-options']).toBe('DENY');
		expect(response.headers['content-security-policy']).toBe("default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'");
		expect(response.headers['cache-control']).toBe('no-store');
	});

	it('should pass the consent model to renderConsent', async () => {
		const withLabel = await buildFixture({options: {environmentLabel: 'staging'}});
		await seedPending(withLabel.storage, {userId: 'user-1', userDisplayName: 'User One'});

		await consentPageHandler(withLabel.context, stateRequest());

		expect(withLabel.renderConsent).toHaveBeenCalledWith({
			action: '/base/oauth/consent',
			state: 'state-1',
			clientId: 'client-1',
			clientName: 'Test Client',
			clientHost: undefined,
			metadataDocument: false,
			redirectUri: 'https://app.example/callback',
			redirectTarget: 'app.example',
			redirectIsLocalhost: false,
			userDisplayName: 'User One',
			productName: 'Test MCP',
			environmentLabel: 'staging'
		});
	});

	it('should flag loopback redirects', async () => {
		await seedPending(fixture.storage, {stateId: 'loopback', userId: 'user-1', redirectUri: 'http://localhost:8080/cb'});

		await consentPageHandler(fixture.context, stateRequest('loopback'));

		expect(fixture.renderConsent).toHaveBeenCalledWith(expect.objectContaining({redirectIsLocalhost: true, redirectTarget: 'localhost:8080'}));
	});

	it('should show the CIMD client host for metadata document clients', async () => {
		await seedPending(fixture.storage, {stateId: 'cimd', userId: 'user-1', clientId: 'https://client.example/client.json'});

		await consentPageHandler(fixture.context, stateRequest('cimd'));

		expect(fixture.renderConsent).toHaveBeenCalledWith(expect.objectContaining({metadataDocument: true, clientHost: 'client.example'}));
	});

	it('should skip verification when the upstream has no verifyUser', async () => {
		const noVerify = await buildFixture();
		delete (noVerify.upstream as Partial<typeof noVerify.upstream>).verifyUser;
		await seedPending(noVerify.storage, {userId: 'user-1'});

		const response = await consentPageHandler(noVerify.context, stateRequest());

		expect(response.status).toBe(200);
	});
});
