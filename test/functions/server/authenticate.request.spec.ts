'use strict';

import {SignJWT, generateKeyPair} from 'jose';

import authenticateRequest from '../../../src/functions/server/authenticate.request';
import signAccessToken from '../../../src/functions/jwt/sign.access.token';
import {buildContext, fixedNow, getKeyPair, issuerUrl, resourceUrl} from '../../helpers/server.fixtures';

const signFor = async (overrides: {issuer?: string; resource?: string; now?: Date; ttlSeconds?: number} = {}): Promise<string> =>
	signAccessToken(await getKeyPair(), {issuer: issuerUrl, resource: resourceUrl, userId: 'u1', clientId: 'client-1', ttlSeconds: 3600, now: fixedNow, ...overrides});

const bearer = (token: string): Record<string, string> => ({authorization: `Bearer ${token}`});

describe('authenticate.request tests', () => {
	it('should be defined', () => {
		expect(authenticateRequest).toBeDefined();
		expect(typeof authenticateRequest).toBe('function');
	});

	it('should challenge without a token', async () => {
		const context = await buildContext();

		const result: any = await authenticateRequest(context, {}, {id: 3});

		expect(result.status).toBe(401);
		expect(result.reason).toBe('missing_token');
		expect(result.headers['www-authenticate']).toBe(`Bearer resource_metadata="${context.resourceMetadataUrl}"`);
		expect(result.body.id).toBe(3);
	});

	it('should challenge for a non-Bearer scheme', async () => {
		const context = await buildContext();

		const result: any = await authenticateRequest(context, {authorization: 'Basic abc'});

		expect(result.reason).toBe('missing_token');
	});

	it('should challenge for a malformed Bearer header with several parts', async () => {
		const context = await buildContext();

		const result: any = await authenticateRequest(context, {authorization: 'Bearer a b'});

		expect(result.reason).toBe('missing_token');
	});

	it('should reject an invalid token', async () => {
		const context = await buildContext();

		const result: any = await authenticateRequest(context, bearer('not-a-jwt'));

		expect(result.reason).toBe('invalid_token');
		expect(result.headers['www-authenticate']).toContain('error="invalid_token"');
	});

	it('should reject an expired token using the injected clock', async () => {
		const token = await signFor();
		const context = await buildContext({context: {now: () => new Date(fixedNow.getTime() + 7200000)}});

		const result: any = await authenticateRequest(context, bearer(token));

		expect(result.reason).toBe('expired');
		expect(result.status).toBe(401);
	});

	it('should reject a token with the wrong issuer', async () => {
		const context = await buildContext();

		const result: any = await authenticateRequest(context, bearer(await signFor({issuer: 'https://evil.example.com'})));

		expect(result.reason).toBe('invalid_token');
	});

	it('should reject a token with the wrong audience', async () => {
		const context = await buildContext();

		const result: any = await authenticateRequest(context, bearer(await signFor({resource: 'https://other.example.com/mcp'})));

		expect(result.reason).toBe('invalid_token');
	});

	it('should reject a token signed by another key', async () => {
		const context = await buildContext();
		const other = await generateKeyPair('RS256');
		const token = await new SignJWT({})
			.setProtectedHeader({alg: 'RS256'})
			.setIssuer(issuerUrl)
			.setAudience(resourceUrl)
			.setSubject('u1')
			.setExpirationTime('2h')
			.sign(other.privateKey);

		const result: any = await authenticateRequest(context, bearer(token));

		expect(result.reason).toBe('invalid_token');
	});

	it('should report user_inactive when the token has no subject', async () => {
		const context = await buildContext();
		const keys = await getKeyPair();
		const token = await new SignJWT({})
			.setProtectedHeader({alg: 'RS256'})
			.setIssuer(issuerUrl)
			.setAudience(resourceUrl)
			.setIssuedAt(Math.floor(fixedNow.getTime() / 1000))
			.setExpirationTime(Math.floor(fixedNow.getTime() / 1000) + 3600)
			.sign(keys.privateKey);

		const result: any = await authenticateRequest(context, bearer(token));

		expect(result.reason).toBe('user_inactive');
		expect(context.options.loadActiveUser).not.toHaveBeenCalled();
	});

	it('should report user_inactive when loadActiveUser returns null', async () => {
		const loadActiveUser = jest.fn(async () => null);
		const context = await buildContext({options: {loadActiveUser}});

		const result: any = await authenticateRequest(context, bearer(await signFor()));

		expect(loadActiveUser).toHaveBeenCalledWith('u1');
		expect(result.reason).toBe('user_inactive');
		expect(result.headers['www-authenticate']).toContain('error="invalid_token"');
	});

	it('should return the user and claims on success', async () => {
		const context = await buildContext();

		const result: any = await authenticateRequest(context, bearer(await signFor()));

		expect(result.user).toEqual({id: 'u1'});
		expect(result.claims).toEqual(expect.objectContaining({sub: 'u1', iss: issuerUrl, aud: resourceUrl, client_id: 'client-1'}));
	});

	it('should accept a case-insensitive bearer scheme', async () => {
		const context = await buildContext();

		const result: any = await authenticateRequest(context, {authorization: `bearer ${await signFor()}`});

		expect(result.user).toEqual({id: 'u1'});
	});
});
