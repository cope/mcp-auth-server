'use strict';

import consentDecisionHandler from '../../src/handlers/consent.decision.handler';
import {buildFixture, clientId, fixedNow, formRequest, issuer, locationOf, seedPending} from '../helpers/handler.fixtures';
import type {Fixture} from '../helpers/handler.fixtures';

describe('consent.decision.handler tests', () => {
	let fixture: Fixture;

	beforeEach(async () => {
		fixture = await buildFixture();
		await seedPending(fixture.storage, {userId: 'user-1'});
	});

	it('should be defined', () => {
		expect(consentDecisionHandler).toBeDefined();
		expect(typeof consentDecisionHandler).toBe('function');
	});

	it('should answer 400 for an invalid decision', async () => {
		const response = await consentDecisionHandler(fixture.context, formRequest({decision: 'maybe', state: 'state-1'}));

		expect(response.status).toBe(400);
		expect(await fixture.storage.getPendingAuthorization('state-1', fixedNow)).not.toBeNull();
	});

	it('should answer 400 for a missing body', async () => {
		const response = await consentDecisionHandler(fixture.context, formRequest(undefined));

		expect(response.status).toBe(400);
	});

	it('should answer 400 for an invalid state', async () => {
		const response = await consentDecisionHandler(fixture.context, formRequest({decision: 'approve', state: 'missing'}));

		expect(response.status).toBe(400);
	});

	it('should answer 400 when the pending authorization is taken concurrently', async () => {
		jest.spyOn(fixture.storage, 'takePendingAuthorization').mockResolvedValueOnce(null);

		const response = await consentDecisionHandler(fixture.context, formRequest({decision: 'approve', state: 'state-1'}));

		expect(response.status).toBe(400);
		expect(await fixture.storage.hasConsent(clientId, 'user-1')).toBe(false);
	});

	it('should redirect access_denied with state and iss on deny', async () => {
		const response = await consentDecisionHandler(fixture.context, formRequest({decision: 'deny', state: 'state-1'}));

		const location: URL = locationOf(response);
		expect(location.searchParams.get('error')).toBe('access_denied');
		expect(location.searchParams.get('error_description')).toBe('the user denied the request');
		expect(location.searchParams.get('state')).toBe('client-state');
		expect(location.searchParams.get('iss')).toBe(issuer);
		expect(await fixture.storage.getPendingAuthorization('state-1', fixedNow)).toBeNull();
		expect(await fixture.storage.hasConsent(clientId, 'user-1')).toBe(false);
	});

	it('should store consent and issue a code on approve', async () => {
		const saveAuthorizationCode = jest.spyOn(fixture.storage, 'saveAuthorizationCode');

		const response = await consentDecisionHandler(fixture.context, formRequest({decision: 'approve', state: 'state-1'}));

		const location: URL = locationOf(response);
		expect(location.searchParams.get('code')).toBeTruthy();
		expect(location.searchParams.get('state')).toBe('client-state');
		expect(location.searchParams.get('iss')).toBe(issuer);
		expect(await fixture.storage.hasConsent(clientId, 'user-1')).toBe(true);
		expect(saveAuthorizationCode).toHaveBeenCalledWith(expect.objectContaining({clientId, userId: 'user-1'}));
	});
});
