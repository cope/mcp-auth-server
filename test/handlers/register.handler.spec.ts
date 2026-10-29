'use strict';

import registerHandler from '../../src/handlers/register.handler';
import {buildFixture, fixedNow, formRequest, redirectUri} from '../helpers/handler.fixtures';
import type {Fixture} from '../helpers/handler.fixtures';

describe('register.handler tests', () => {
	let fixture: Fixture;

	beforeEach(async () => {
		fixture = await buildFixture();
	});

	const errorOf = (response: Awaited<ReturnType<typeof registerHandler>>): unknown[] => [response.status, (response.body as {error: string}).error];
	const invalidRedirectUri: unknown[] = [400, 'invalid_redirect_uri'];

	it('should be defined', () => {
		expect(registerHandler).toBeDefined();
		expect(typeof registerHandler).toBe('function');
	});

	it('should reject a missing body', async () => {
		expect(errorOf(await registerHandler(fixture.context, formRequest(undefined)))).toEqual(invalidRedirectUri);
	});

	it('should reject redirect_uris that is not an array', async () => {
		expect(errorOf(await registerHandler(fixture.context, formRequest({redirect_uris: redirectUri})))).toEqual(invalidRedirectUri);
	});

	it('should reject an empty redirect_uris array', async () => {
		expect(errorOf(await registerHandler(fixture.context, formRequest({redirect_uris: []})))).toEqual(invalidRedirectUri);
	});

	it('should reject a disallowed redirect uri, truncate it and log the rejection', async () => {
		const long = `https://evil.example/${'a'.repeat(300)}`;

		const response = await registerHandler(fixture.context, formRequest({redirect_uris: [redirectUri, long], client_name: 'Evil'}));

		expect(errorOf(response)).toEqual(invalidRedirectUri);
		expect((response.body as {error_description: string}).error_description).toBe(`redirect_uri not allowed: ${long.slice(0, 200)}`);
		expect(fixture.logger.info).toHaveBeenCalledWith('MCP register rejected', {redirectUris: [redirectUri, long], clientName: 'Evil'});
	});

	it('should reject a non-string redirect uri and tolerate a missing logger', async () => {
		const quiet = await buildFixture({options: {logger: undefined}});

		expect(errorOf(await registerHandler(quiet.context, formRequest({redirect_uris: [42]})))).toEqual(invalidRedirectUri);
	});

	it('should register a client and answer 201 with the registration body', async () => {
		const response = await registerHandler(fixture.context, formRequest({redirect_uris: [redirectUri], client_name: 'My Client', application_type: 'native'}));

		expect(response.status).toBe(201);
		expect(response.headers['cache-control']).toBe('no-store');
		const body = response.body as Record<string, unknown>;
		expect(body).toEqual({
			client_id: body.client_id,
			client_id_issued_at: Math.floor(fixedNow.getTime() / 1000),
			client_name: 'My Client',
			redirect_uris: [redirectUri],
			application_type: 'native',
			token_endpoint_auth_method: 'none',
			grant_types: ['authorization_code', 'refresh_token'],
			response_types: ['code']
		});
		const stored = await fixture.storage.getClient(body.client_id as string);
		expect(stored).toEqual({
			clientId: body.client_id,
			clientName: 'My Client',
			redirectUris: [redirectUri],
			applicationType: 'native',
			tokenEndpointAuthMethod: 'none',
			grantTypes: ['authorization_code', 'refresh_token'],
			responseTypes: ['code'],
			createdAt: fixedNow
		});
	});

	it('should truncate client_name to 200 and application_type to 32 characters', async () => {
		const response = await registerHandler(fixture.context, formRequest({redirect_uris: [redirectUri], client_name: 'n'.repeat(500), application_type: 't'.repeat(100)}));

		const body = response.body as {client_name: string; application_type: string};
		expect(body.client_name).toHaveLength(200);
		expect(body.application_type).toHaveLength(32);
	});

	it('should omit application_type and client_name when they are not strings', async () => {
		const response = await registerHandler(fixture.context, formRequest({redirect_uris: [redirectUri], client_name: 5, application_type: 5}));

		const body = response.body as Record<string, unknown>;
		expect(response.status).toBe(201);
		expect('application_type' in body).toBe(false);
		expect(body.client_name).toBeUndefined();
	});
});
