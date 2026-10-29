'use strict';

import {createHash} from 'node:crypto';

import issueTokens from '../../../src/functions/server/issue.tokens';
import rotateRefreshToken from '../../../src/functions/server/rotate.refresh.token';
import {buildContext, fixedNow, resourceUrl} from '../../helpers/server.fixtures';

jest.mock('../../../src/functions/server/issue.tokens');

const mockIssueTokens = issueTokens as jest.MockedFunction<typeof issueTokens>;
const sha256Hex = (value: string): string => createHash('sha256').update(value).digest('hex');
const expiresAt: Date = new Date(fixedNow.getTime() + 86400000);

const seed = async (context: any, overrides: Record<string, unknown> = {}) =>
	context.options.storage.saveRefreshToken({
		tokenHash: sha256Hex('rt-1'),
		familyId: 'family-1',
		clientId: 'client-1',
		userId: 'u1',
		resource: resourceUrl,
		expiresAt,
		...overrides
	});

describe('rotate.refresh.token tests', () => {
	beforeEach(() => {
		mockIssueTokens.mockResolvedValue({status: 200, headers: {}, body: {access_token: 'new'}});
	});

	it('should be defined', () => {
		expect(rotateRefreshToken).toBeDefined();
		expect(typeof rotateRefreshToken).toBe('function');
	});

	it('should require refresh_token and client_id', async () => {
		const context = await buildContext();

		const missingToken = await rotateRefreshToken(context, {client_id: 'client-1'});
		const missingClient = await rotateRefreshToken(context, {refresh_token: 'rt-1'});

		expect(missingToken.body).toEqual({error: 'invalid_request', error_description: 'refresh_token and client_id are required'});
		expect(missingClient.status).toBe(400);
		expect(missingClient.headers['cache-control']).toBe('no-store');
	});

	it('should reject an unknown token', async () => {
		const context = await buildContext();

		const response = await rotateRefreshToken(context, {refresh_token: 'rt-1', client_id: 'client-1'});

		expect((response.body as any).error).toBe('invalid_grant');
		expect(mockIssueTokens).not.toHaveBeenCalled();
	});

	it('should reject a token that belongs to another client', async () => {
		const context = await buildContext();
		await seed(context);

		const response = await rotateRefreshToken(context, {refresh_token: 'rt-1', client_id: 'other-client'});

		expect((response.body as any).error).toBe('invalid_grant');
		expect(mockIssueTokens).not.toHaveBeenCalled();
	});

	it('should reject an expired token', async () => {
		const context = await buildContext();
		await seed(context, {expiresAt: fixedNow});

		const response = await rotateRefreshToken(context, {refresh_token: 'rt-1', client_id: 'client-1'});

		expect((response.body as any).error).toBe('invalid_grant');
		expect(mockIssueTokens).not.toHaveBeenCalled();
	});

	it('should revoke the whole family when a revoked token is presented', async () => {
		const context = await buildContext();
		await seed(context);
		await seed(context, {tokenHash: 'sibling'});
		await context.options.storage.revokeRefreshTokenFamily('family-1', new Date(0));
		await seed(context, {tokenHash: 'late-sibling', revokedAt: undefined});
		const revokeSpy = jest.spyOn(context.options.storage, 'revokeRefreshTokenFamily');

		const response = await rotateRefreshToken(context, {refresh_token: 'rt-1', client_id: 'client-1'});

		expect((response.body as any).error).toBe('invalid_grant');
		expect(revokeSpy).toHaveBeenCalledWith('family-1', fixedNow);
		expect((await context.options.storage.findRefreshToken('late-sibling'))?.revokedAt).toEqual(fixedNow);
		expect(mockIssueTokens).not.toHaveBeenCalled();
	});

	it('should rotate with the same family and absolute expiry and mark the old token used', async () => {
		const context = await buildContext();
		await seed(context);

		const response = await rotateRefreshToken(context, {refresh_token: 'rt-1', client_id: 'client-1'});

		expect(response.status).toBe(200);
		expect(mockIssueTokens).toHaveBeenCalledWith(context, 'client-1', 'u1', 'family-1', expiresAt, sha256Hex('rt-1'));
		expect((await context.options.storage.findRefreshToken(sha256Hex('rt-1')))?.usedAt).toEqual(fixedNow);
	});

	it('should revoke the family when the token was already used (replay)', async () => {
		const context = await buildContext();
		await seed(context);
		await seed(context, {tokenHash: 'sibling'});

		await rotateRefreshToken(context, {refresh_token: 'rt-1', client_id: 'client-1'});
		mockIssueTokens.mockClear();
		const replay = await rotateRefreshToken(context, {refresh_token: 'rt-1', client_id: 'client-1'});

		expect(replay.body).toEqual({error: 'invalid_grant', error_description: 'refresh token was already used; all tokens of this session are revoked'});
		expect(mockIssueTokens).not.toHaveBeenCalled();
		expect((await context.options.storage.findRefreshToken('sibling'))?.revokedAt).toEqual(fixedNow);
		expect((await context.options.storage.findRefreshToken(sha256Hex('rt-1')))?.revokedAt).toEqual(fixedNow);
	});
});
