'use strict';

import {createHash} from 'node:crypto';

import issueAuthorizationCode from '../../../src/functions/server/issue.authorization.code';
import {buildContext, buildPending, fixedNow, issuerUrl} from '../../helpers/server.fixtures';

describe('issue.authorization.code tests', () => {
	it('should be defined', () => {
		expect(issueAuthorizationCode).toBeDefined();
		expect(typeof issueAuthorizationCode).toBe('function');
	});

	it('should redirect with code, state and iss and store only the sha256 hash with a ttl', async () => {
		const context = await buildContext();
		const saveSpy = jest.spyOn(context.options.storage, 'saveAuthorizationCode');
		const pending = buildPending({userId: 'u1'});

		const response = await issueAuthorizationCode(context, pending);

		const location = new URL(response.headers.location);
		const code = location.searchParams.get('code') as string;
		expect(response.status).toBe(302);
		expect(location.origin + location.pathname).toBe('https://client.example.com/cb');
		expect(code.length).toBeGreaterThanOrEqual(32);
		expect(location.searchParams.get('state')).toBe('client-state');
		expect(location.searchParams.get('iss')).toBe(issuerUrl);

		const expectedHash = createHash('sha256').update(code).digest('hex');
		expect(saveSpy).toHaveBeenCalledWith({
			codeHash: expectedHash,
			clientId: 'client-1',
			redirectUri: pending.redirectUri,
			codeChallenge: 'challenge',
			resource: pending.resource,
			userId: 'u1',
			expiresAt: new Date(fixedNow.getTime() + 60000)
		});
		expect(JSON.stringify(saveSpy.mock.calls[0][0])).not.toContain(code);
		expect(await context.options.storage.claimAuthorizationCode(expectedHash, fixedNow)).not.toBeNull();
		expect(await context.options.storage.claimAuthorizationCode(expectedHash, fixedNow)).toBeNull();
	});

	it('should omit state when the client sent none', async () => {
		const context = await buildContext();

		const response = await issueAuthorizationCode(context, buildPending({userId: 'u1', clientState: undefined}));

		expect(new URL(response.headers.location).searchParams.has('state')).toBe(false);
	});
});
