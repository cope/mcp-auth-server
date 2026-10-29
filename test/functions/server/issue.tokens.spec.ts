'use strict';

import {createHash} from 'node:crypto';

import {jwtVerify} from 'jose';

import issueTokens from '../../../src/functions/server/issue.tokens';
import {buildContext, fixedNow, getKeyPair, issuerUrl, resourceUrl} from '../../helpers/server.fixtures';

const sha256Hex = (value: string): string => createHash('sha256').update(value).digest('hex');
const expiresAt: Date = new Date(fixedNow.getTime() + 86400000);

describe('issue.tokens tests', () => {
	it('should be defined', () => {
		expect(issueTokens).toBeDefined();
		expect(typeof issueTokens).toBe('function');
	});

	it('should issue a signed access token and a hashed refresh token with no-store headers', async () => {
		const context = await buildContext();
		const saveSpy = jest.spyOn(context.options.storage, 'saveRefreshToken');

		const response = await issueTokens(context, 'client-1', 'u1', 'family-1', expiresAt);

		const body = response.body as Record<string, any>;
		expect(response.status).toBe(200);
		expect(response.headers['cache-control']).toBe('no-store');
		expect(response.headers.pragma).toBe('no-cache');
		expect(body.token_type).toBe('Bearer');
		expect(body.expires_in).toBe(3600);

		const {payload} = await jwtVerify(body.access_token, (await getKeyPair()).publicKey, {issuer: issuerUrl, audience: resourceUrl, currentDate: fixedNow});
		expect(payload.sub).toBe('u1');
		expect(payload.client_id).toBe('client-1');

		expect(saveSpy).toHaveBeenCalledWith({
			tokenHash: sha256Hex(body.refresh_token),
			familyId: 'family-1',
			clientId: 'client-1',
			userId: 'u1',
			resource: resourceUrl,
			expiresAt
		});
		expect(JSON.stringify(saveSpy.mock.calls[0][0])).not.toContain(body.refresh_token);
		expect(await context.options.storage.findRefreshToken(sha256Hex(body.refresh_token))).not.toBeNull();
	});

	it('should succeed when the parent token is not revoked', async () => {
		const context = await buildContext();
		await context.options.storage.saveRefreshToken({tokenHash: 'parent', familyId: 'family-1', clientId: 'client-1', userId: 'u1', resource: resourceUrl, expiresAt});

		const response = await issueTokens(context, 'client-1', 'u1', 'family-1', expiresAt, 'parent');

		expect(response.status).toBe(200);
	});

	it('should revoke the family when the parent was revoked during rotation', async () => {
		const context = await buildContext();
		await context.options.storage.saveRefreshToken({tokenHash: 'parent', familyId: 'family-1', clientId: 'client-1', userId: 'u1', resource: resourceUrl, expiresAt});
		await context.options.storage.revokeRefreshTokenFamily('family-1', fixedNow);

		const response = await issueTokens(context, 'client-1', 'u1', 'family-1', expiresAt, 'parent');

		expect(response.status).toBe(400);
		expect(response.headers['cache-control']).toBe('no-store');
		expect(response.body).toEqual({error: 'invalid_grant', error_description: 'refresh token was revoked during rotation'});
		const body = response.body as Record<string, unknown>;
		expect(body.access_token).toBeUndefined();
	});

	it('should skip the revocation check when the parent record is missing', async () => {
		const context = await buildContext();

		const response = await issueTokens(context, 'client-1', 'u1', 'family-1', expiresAt, 'missing-parent');

		expect(response.status).toBe(200);
	});
});
