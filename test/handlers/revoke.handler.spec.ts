'use strict';

import sha256Hex from '../../src/functions/crypto/sha256.hex';
import revokeHandler from '../../src/handlers/revoke.handler';
import type RefreshTokenRecordType from '../../src/types/refresh.token.record.type';
import {buildFixture, clientId, fixedNow, formRequest, resource} from '../helpers/handler.fixtures';
import type {Fixture} from '../helpers/handler.fixtures';

describe('revoke.handler tests', () => {
	let fixture: Fixture;

	const saveToken = async (value: string, overrides: Partial<RefreshTokenRecordType> = {}): Promise<string> => {
		const tokenHash: string = await sha256Hex(value);
		await fixture.storage.saveRefreshToken({
			tokenHash,
			familyId: 'family-1',
			clientId,
			userId: 'user-1',
			resource,
			expiresAt: new Date(fixedNow.getTime() + 100000),
			...overrides
		});
		return tokenHash;
	};

	beforeEach(async () => {
		fixture = await buildFixture();
	});

	it('should be defined', () => {
		expect(revokeHandler).toBeDefined();
		expect(typeof revokeHandler).toBe('function');
	});

	it('should answer 401 invalid_client when client_secret is sent', async () => {
		const response = await revokeHandler(fixture.context, formRequest({token: 't', client_id: clientId, client_secret: 's'}));

		expect(response.status).toBe(401);
		expect((response.body as {error: string}).error).toBe('invalid_client');
	});

	it('should answer 401 invalid_client when an authorization header is sent', async () => {
		const response = await revokeHandler(fixture.context, formRequest({token: 't', client_id: clientId}, {authorization: 'Bearer x'}));

		expect(response.status).toBe(401);
	});

	it('should answer 400 when token is missing', async () => {
		const response = await revokeHandler(fixture.context, formRequest({client_id: clientId}));

		expect(response.status).toBe(400);
		expect((response.body as {error: string}).error).toBe('invalid_request');
	});

	it('should answer 400 when client_id is missing', async () => {
		const response = await revokeHandler(fixture.context, formRequest({token: 't'}));

		expect(response.status).toBe(400);
	});

	it('should answer 200 with an empty body for an unknown token', async () => {
		const response = await revokeHandler(fixture.context, formRequest({token: 'unknown', client_id: clientId}));

		expect(response.status).toBe(200);
		expect(response.body).toEqual({});
	});

	it('should not revoke a token that belongs to another client', async () => {
		const tokenHash: string = await saveToken('mine');

		const response = await revokeHandler(fixture.context, formRequest({token: 'mine', client_id: 'other-client'}));

		expect(response.status).toBe(200);
		expect((await fixture.storage.findRefreshToken(tokenHash))?.revokedAt).toBeUndefined();
	});

	it('should revoke the whole token family with no-store headers', async () => {
		const first: string = await saveToken('first');
		const second: string = await saveToken('second');
		const unrelated: string = await saveToken('unrelated', {familyId: 'family-2'});

		const response = await revokeHandler(fixture.context, formRequest({token: 'first', client_id: clientId}));

		expect(response.status).toBe(200);
		expect(response.headers['cache-control']).toBe('no-store');
		expect(response.headers.pragma).toBe('no-cache');
		expect((await fixture.storage.findRefreshToken(first))?.revokedAt).toEqual(fixedNow);
		expect((await fixture.storage.findRefreshToken(second))?.revokedAt).toEqual(fixedNow);
		expect((await fixture.storage.findRefreshToken(unrelated))?.revokedAt).toBeUndefined();
	});
});
