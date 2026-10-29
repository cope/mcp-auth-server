'use strict';

import attachAndContinue from '../../../src/functions/server/attach.and.continue';
import continueWithUser from '../../../src/functions/server/continue.with.user';
import {buildContext, buildPending} from '../../helpers/server.fixtures';

jest.mock('../../../src/functions/server/continue.with.user');

const mockContinueWithUser = continueWithUser as jest.MockedFunction<typeof continueWithUser>;

describe('attach.and.continue tests', () => {
	it('should be defined', () => {
		expect(attachAndContinue).toBeDefined();
		expect(typeof attachAndContinue).toBe('function');
	});

	it('should attach the user and continue with the attached pending authorization', async () => {
		const context = await buildContext();
		const pending = buildPending();
		await context.options.storage.savePendingAuthorization(pending);
		mockContinueWithUser.mockResolvedValue({status: 302, headers: {location: 'x'}});

		const response = await attachAndContinue(context, pending, {id: 'u1', displayName: 'User One'});

		expect(response).toEqual({status: 302, headers: {location: 'x'}});
		expect(mockContinueWithUser).toHaveBeenCalledWith(context, expect.objectContaining({stateId: 'state-1', userId: 'u1', userDisplayName: 'User One'}));
	});

	it('should return invalid_request when the state is unknown or already used', async () => {
		const context = await buildContext();

		const response = await attachAndContinue(context, buildPending(), {id: 'u1'});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({error: 'invalid_request', error_description: 'unknown or already used state'});
		expect(mockContinueWithUser).not.toHaveBeenCalled();
	});
});
