'use strict';

import resumeHandler from '../../src/handlers/resume.handler';
import {buildFixture, fixedNow, issuer, locationOf, seedPending, stateRequest} from '../helpers/handler.fixtures';
import type {Fixture} from '../helpers/handler.fixtures';

describe('resume.handler tests', () => {
	let fixture: Fixture;

	beforeEach(async () => {
		fixture = await buildFixture();
		await seedPending(fixture.storage);
	});

	it('should be defined', () => {
		expect(resumeHandler).toBeDefined();
		expect(typeof resumeHandler).toBe('function');
	});

	it('should answer 400 for an unknown state', async () => {
		const response = await resumeHandler(fixture.context, stateRequest('missing'));

		expect(response.status).toBe(400);
		expect(fixture.upstream.resume).not.toHaveBeenCalled();
	});

	it('should answer 400 for an expired state', async () => {
		await seedPending(fixture.storage, {stateId: 'old', expiresAt: new Date(fixedNow.getTime() - 1)});

		const response = await resumeHandler(fixture.context, stateRequest('old'));

		expect(response.status).toBe(400);
	});

	it('should answer 400 when the state already has a user', async () => {
		await seedPending(fixture.storage, {stateId: 'used', userId: 'user-1'});

		const response = await resumeHandler(fixture.context, stateRequest('used'));

		expect(response.status).toBe(400);
	});

	it('should attach the resumed user and redirect to consent', async () => {
		const response = await resumeHandler(fixture.context, stateRequest());

		expect(response.headers.location).toBe(`${issuer}/oauth/consent?state=state-1`);
		const stored = await fixture.storage.getPendingAuthorization('state-1', fixedNow);
		expect(stored?.userId).toBe('user-1');
		expect(stored?.userDisplayName).toBe('User One');
	});

	it('should issue a code when consent already exists', async () => {
		await fixture.storage.upsertConsent({clientId: 'client-1', userId: 'user-1'});

		const response = await resumeHandler(fixture.context, stateRequest());

		const location: URL = locationOf(response);
		expect(location.searchParams.get('code')).toBeTruthy();
		expect(location.searchParams.get('iss')).toBe(issuer);
	});

	it('should deny access when the upstream resumes no user', async () => {
		fixture.upstream.resume.mockResolvedValueOnce(null);

		const response = await resumeHandler(fixture.context, stateRequest());

		expect(locationOf(response).searchParams.get('error')).toBe('access_denied');
		expect(await fixture.storage.getPendingAuthorization('state-1', fixedNow)).toBeNull();
	});

	it('should deny access when the upstream has no resume', async () => {
		const noResume = await buildFixture();
		delete (noResume.upstream as Partial<typeof noResume.upstream>).resume;
		await seedPending(noResume.storage);

		const response = await resumeHandler(noResume.context, stateRequest());

		expect(locationOf(response).searchParams.get('error')).toBe('access_denied');
	});

	it('should deny access when the resumed user has no id', async () => {
		fixture.upstream.resume.mockResolvedValueOnce({id: ''});

		const response = await resumeHandler(fixture.context, stateRequest());

		expect(locationOf(response).searchParams.get('error')).toBe('access_denied');
	});

	it('should deny access and log when resume throws an Error', async () => {
		fixture.upstream.resume.mockRejectedValueOnce(new Error('resume failed'));

		const response = await resumeHandler(fixture.context, stateRequest());

		expect(locationOf(response).searchParams.get('error')).toBe('access_denied');
		expect(fixture.logger.error).toHaveBeenCalledWith('MCP upstream resume failed', {error: 'resume failed'});
	});

	it('should log the stringified non-Error failure', async () => {
		fixture.upstream.resume.mockRejectedValueOnce('boom');

		await resumeHandler(fixture.context, stateRequest());

		expect(fixture.logger.error).toHaveBeenCalledWith('MCP upstream resume failed', {error: 'boom'});
	});

	it('should tolerate a missing logger', async () => {
		const quiet = await buildFixture({options: {logger: undefined}});
		await seedPending(quiet.storage);
		quiet.upstream.resume.mockRejectedValueOnce(new Error('boom'));

		const response = await resumeHandler(quiet.context, stateRequest());

		expect(locationOf(response).searchParams.get('error')).toBe('access_denied');
	});

	it('should answer 400 when attaching the user loses the race', async () => {
		fixture.upstream.resume.mockImplementationOnce(async () => {
			await fixture.storage.attachUserToPendingAuthorization('state-1', 'other-user', fixedNow);
			return {id: 'user-1'};
		});

		const response = await resumeHandler(fixture.context, stateRequest());

		expect(response.status).toBe(400);
	});
});
