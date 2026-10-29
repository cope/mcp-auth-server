'use strict';

import continueWithUser from '../../../src/functions/server/continue.with.user';
import issueAuthorizationCode from '../../../src/functions/server/issue.authorization.code';
import {buildContext, buildPending, issuerUrl} from '../../helpers/server.fixtures';

jest.mock('../../../src/functions/server/issue.authorization.code');

const mockIssueAuthorizationCode = issueAuthorizationCode as jest.MockedFunction<typeof issueAuthorizationCode>;

describe('continue.with.user tests', () => {
	it('should be defined', () => {
		expect(continueWithUser).toBeDefined();
		expect(typeof continueWithUser).toBe('function');
	});

	it('should redirect to the consent page when consent is missing', async () => {
		const context = await buildContext();

		const response = await continueWithUser(context, buildPending({stateId: 'a b', userId: 'u1'}));

		expect(response.status).toBe(302);
		expect(response.headers.location).toBe(`${issuerUrl}/oauth/consent?state=a%20b`);
		expect(mockIssueAuthorizationCode).not.toHaveBeenCalled();
	});

	it('should take the pending authorization and issue a code when consent exists', async () => {
		const context = await buildContext();
		const pending = buildPending({userId: 'u1'});
		await context.options.storage.savePendingAuthorization(pending);
		await context.options.storage.upsertConsent({clientId: 'client-1', userId: 'u1'});
		mockIssueAuthorizationCode.mockResolvedValue({status: 302, headers: {location: 'code-redirect'}});

		const response = await continueWithUser(context, pending);

		expect(response.headers.location).toBe('code-redirect');
		expect(mockIssueAuthorizationCode).toHaveBeenCalledWith(context, expect.objectContaining({stateId: 'state-1'}));
		expect(await context.options.storage.getPendingAuthorization('state-1', new Date(0))).toBeNull();
	});

	it('should return a plain 400 when the pending authorization cannot be taken', async () => {
		const context = await buildContext();
		await context.options.storage.upsertConsent({clientId: 'client-1', userId: 'u1'});

		const response = await continueWithUser(context, buildPending({userId: 'u1'}));

		expect(response.status).toBe(400);
		expect(response.headers['content-type']).toBe('text/plain');
		expect(response.body).toBe('Invalid or expired authorization request');
		expect(mockIssueAuthorizationCode).not.toHaveBeenCalled();
	});
});
