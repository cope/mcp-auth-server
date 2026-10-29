'use strict';

import callbackHandler from '../../src/handlers/callback.handler';
import {buildFixture, buildRequest, fixedNow, issuer, locationOf, seedPending, stateRequest} from '../helpers/handler.fixtures';
import type {Fixture} from '../helpers/handler.fixtures';

describe('callback.handler tests', () => {
	let fixture: Fixture;

	beforeEach(async () => {
		fixture = await buildFixture();
		await seedPending(fixture.storage);
	});

	it('should be defined', () => {
		expect(callbackHandler).toBeDefined();
		expect(typeof callbackHandler).toBe('function');
	});

	it('should answer 400 for an unknown state', async () => {
		const response = await callbackHandler(fixture.context, stateRequest('missing'));

		expect(response.status).toBe(400);
		expect(response.body).toEqual({error: 'invalid_request', error_description: 'unknown or already used state'});
		expect(fixture.upstream.callback).not.toHaveBeenCalled();
	});

	it('should answer 400 for a missing state', async () => {
		const response = await callbackHandler(fixture.context, buildRequest());

		expect(response.status).toBe(400);
	});

	it('should answer 400 for an expired state', async () => {
		await seedPending(fixture.storage, {stateId: 'old', expiresAt: new Date(fixedNow.getTime() - 1)});

		const response = await callbackHandler(fixture.context, stateRequest('old'));

		expect(response.status).toBe(400);
	});

	it('should answer 400 when the state already has a user', async () => {
		await seedPending(fixture.storage, {stateId: 'used', userId: 'user-1'});

		const response = await callbackHandler(fixture.context, stateRequest('used'));

		expect(response.status).toBe(400);
		expect(fixture.upstream.callback).not.toHaveBeenCalled();
	});

	it('should use the default claim mapping and redirect to consent', async () => {
		const response = await callbackHandler(fixture.context, stateRequest());

		expect(response.headers.location).toBe(`${issuer}/oauth/consent?state=state-1`);
		const stored = await fixture.storage.getPendingAuthorization('state-1', fixedNow);
		expect(stored?.userId).toBe('user-1');
		expect(stored?.userDisplayName).toBe('User One');
	});

	it('should pass the upstream context to the callback', async () => {
		await callbackHandler(fixture.context, stateRequest());

		const upstreamContext = fixture.upstream.callback.mock.calls[0][0];
		expect(upstreamContext.pending.stateId).toBe('state-1');
		expect(upstreamContext.resumeUrl).toBe(`${issuer}/oauth/resume?state=state-1`);
	});

	it('should use resolveUser when configured', async () => {
		const resolveUser = jest.fn(async (claims: Record<string, unknown>) => ({id: `mapped-${String(claims.sub)}`, displayName: 'Mapped'}));
		const mapped = await buildFixture({options: {resolveUser}});
		await seedPending(mapped.storage);

		await callbackHandler(mapped.context, stateRequest());

		expect(resolveUser).toHaveBeenCalledWith({sub: 'user-1', name: 'User One'});
		const stored = await mapped.storage.getPendingAuthorization('state-1', fixedNow);
		expect(stored?.userId).toBe('mapped-user-1');
	});

	it('should deny access when claims carry no subject and no resolveUser is configured', async () => {
		fixture.upstream.callback.mockResolvedValueOnce({name: 'No Subject'});

		const response = await callbackHandler(fixture.context, stateRequest());

		expect(locationOf(response).searchParams.get('error')).toBe('access_denied');
		expect(await fixture.storage.getPendingAuthorization('state-1', fixedNow)).toBeNull();
	});

	it('should issue a code when the user already consented', async () => {
		await fixture.storage.upsertConsent({clientId: 'client-1', userId: 'user-1'});

		const response = await callbackHandler(fixture.context, stateRequest());

		const location: URL = locationOf(response);
		expect(location.searchParams.get('code')).toBeTruthy();
		expect(location.searchParams.get('iss')).toBe(issuer);
	});

	it('should deny access when the upstream returns no claims', async () => {
		fixture.upstream.callback.mockResolvedValueOnce(null);

		const response = await callbackHandler(fixture.context, stateRequest());

		expect(locationOf(response).searchParams.get('error')).toBe('access_denied');
		expect(await fixture.storage.getPendingAuthorization('state-1', fixedNow)).toBeNull();
	});

	it('should deny access when the upstream has no callback', async () => {
		const noCallback = await buildFixture();
		delete (noCallback.upstream as Partial<typeof noCallback.upstream>).callback;
		await seedPending(noCallback.storage);

		const response = await callbackHandler(noCallback.context, stateRequest());

		expect(locationOf(response).searchParams.get('error')).toBe('access_denied');
	});

	it('should deny access when the mapped user has no id', async () => {
		const resolveUser = jest.fn(async () => ({id: ''}));
		const empty = await buildFixture({options: {resolveUser}});
		await seedPending(empty.storage);

		const response = await callbackHandler(empty.context, stateRequest());

		expect(locationOf(response).searchParams.get('error')).toBe('access_denied');
	});

	it('should deny access and log when resolveUser throws an Error', async () => {
		const resolveUser = jest.fn(async () => {
			throw new Error('mapping failed');
		});
		const failing = await buildFixture({options: {resolveUser}});
		await seedPending(failing.storage);

		const response = await callbackHandler(failing.context, stateRequest());

		expect(locationOf(response).searchParams.get('error')).toBe('access_denied');
		expect(failing.logger.error).toHaveBeenCalledWith('MCP upstream callback failed', {error: 'mapping failed'});
	});

	it('should log the stringified non-Error failure', async () => {
		fixture.upstream.callback.mockRejectedValueOnce('boom');

		await callbackHandler(fixture.context, stateRequest());

		expect(fixture.logger.error).toHaveBeenCalledWith('MCP upstream callback failed', {error: 'boom'});
	});

	it('should tolerate a missing logger', async () => {
		const quiet = await buildFixture({options: {logger: undefined}});
		await seedPending(quiet.storage);
		quiet.upstream.callback.mockRejectedValueOnce(new Error('boom'));

		const response = await callbackHandler(quiet.context, stateRequest());

		expect(locationOf(response).searchParams.get('error')).toBe('access_denied');
	});

	it('should answer 400 when attaching the user loses the race', async () => {
		fixture.upstream.callback.mockImplementationOnce(async () => {
			await fixture.storage.attachUserToPendingAuthorization('state-1', 'other-user', fixedNow);
			return {sub: 'user-1', name: 'User One'};
		});

		const response = await callbackHandler(fixture.context, stateRequest());

		expect(response.status).toBe(400);
		expect(response.body).toEqual({error: 'invalid_request', error_description: 'unknown or already used state'});
	});
});
