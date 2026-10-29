'use strict';

import authorizeHandler from '../../src/handlers/authorize.handler';
import type HttpResponseType from '../../src/types/http.response.type';
import {authorizeRequest, buildFixture, buildRequest, clientId, codeChallenge, fixedNow, issuer, locationOf, redirectUri, resource, seedClient} from '../helpers/handler.fixtures';
import type {Fixture} from '../helpers/handler.fixtures';

describe('authorize.handler tests', () => {
	let fixture: Fixture;

	beforeEach(async () => {
		fixture = await buildFixture();
		await seedClient(fixture.storage);
	});

	const errorRedirectOf = (response: HttpResponseType): Record<string, unknown> => {
		const location: URL = locationOf(response);
		return {
			status: response.status,
			target: location.origin + location.pathname,
			error: location.searchParams.get('error'),
			state: location.searchParams.get('state'),
			iss: location.searchParams.get('iss'),
			upstreamCalled: fixture.upstream.begin.mock.calls.length > 0
		};
	};

	const expectedErrorRedirect = (error: string): Record<string, unknown> => ({
		status: 302,
		target: redirectUri,
		error,
		state: 'client-state',
		iss: issuer,
		upstreamCalled: false
	});

	it('should be defined', () => {
		expect(authorizeHandler).toBeDefined();
		expect(typeof authorizeHandler).toBe('function');
	});

	it('should answer 400 when client_id is missing', async () => {
		const response = await authorizeHandler(fixture.context, authorizeRequest({client_id: undefined}));

		expect(response.status).toBe(400);
		expect(response.headers.location).toBeUndefined();
		expect(response.body).toEqual({error: 'invalid_request', error_description: 'unknown client_id'});
		expect(fixture.resolveClient).not.toHaveBeenCalled();
	});

	it('should answer 400 and never redirect for an unknown client', async () => {
		const response = await authorizeHandler(fixture.context, authorizeRequest({client_id: 'nobody'}));

		expect(response.status).toBe(400);
		expect(response.headers.location).toBeUndefined();
	});

	it('should answer 400 when redirect_uri is missing', async () => {
		const response = await authorizeHandler(fixture.context, authorizeRequest({redirect_uri: undefined}));

		expect(response.status).toBe(400);
		expect(response.headers.location).toBeUndefined();
	});

	it('should answer 400 when redirect_uri is not registered', async () => {
		const response = await authorizeHandler(fixture.context, authorizeRequest({redirect_uri: 'https://evil.example/cb'}));

		expect(response.status).toBe(400);
		expect(response.headers.location).toBeUndefined();
		expect(response.body).toEqual({error: 'invalid_request', error_description: 'redirect_uri is not registered for this client'});
	});

	it('should treat a request without a query as an unknown client', async () => {
		const response = await authorizeHandler(fixture.context, buildRequest());

		expect(response.status).toBe(400);
	});

	it('should redirect unsupported_response_type with state and iss', async () => {
		const response = await authorizeHandler(fixture.context, authorizeRequest({response_type: 'token'}));

		expect(errorRedirectOf(response)).toEqual(expectedErrorRedirect('unsupported_response_type'));
	});

	it('should redirect invalid_request when code_challenge is missing', async () => {
		const response = await authorizeHandler(fixture.context, authorizeRequest({code_challenge: undefined}));

		expect(errorRedirectOf(response)).toEqual(expectedErrorRedirect('invalid_request'));
	});

	it('should redirect invalid_request when code_challenge has a bad shape', async () => {
		const response = await authorizeHandler(fixture.context, authorizeRequest({code_challenge: 'short'}));

		expect(errorRedirectOf(response)).toEqual(expectedErrorRedirect('invalid_request'));
	});

	it('should redirect invalid_request when code_challenge_method is not S256', async () => {
		const response = await authorizeHandler(fixture.context, authorizeRequest({code_challenge_method: 'plain'}));

		expect(errorRedirectOf(response)).toEqual(expectedErrorRedirect('invalid_request'));
	});

	it('should redirect invalid_target when resource does not match', async () => {
		const response = await authorizeHandler(fixture.context, authorizeRequest({resource: 'https://other.example/mcp'}));

		expect(errorRedirectOf(response)).toEqual(expectedErrorRedirect('invalid_target'));
	});

	it('should omit state from error redirects when the client sent none', async () => {
		const response = await authorizeHandler(fixture.context, authorizeRequest({state: undefined, response_type: 'token'}));

		expect(locationOf(response).searchParams.has('state')).toBe(false);
	});

	it('should store pending authorization and redirect to the upstream', async () => {
		const response = await authorizeHandler(fixture.context, authorizeRequest());

		expect(response.status).toBe(302);
		expect(response.headers.location).toBe('https://idp.test/authorize');
		const upstreamContext = fixture.upstream.begin.mock.calls[0][0];
		const stateId: string = upstreamContext.pending.stateId;
		expect(stateId).toMatch(/^[A-Za-z0-9_-]{43}$/);
		expect(upstreamContext.pending.upstreamCodeVerifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
		expect(upstreamContext.callbackUrl).toBe(`${issuer}/oauth/callback`);

		const stored = await fixture.storage.getPendingAuthorization(stateId, fixedNow);
		expect(stored).toEqual({
			stateId,
			clientId,
			clientName: 'Test Client',
			redirectUri,
			codeChallenge,
			resource,
			clientState: 'client-state',
			upstreamCodeVerifier: upstreamContext.pending.upstreamCodeVerifier,
			expiresAt: new Date(fixedNow.getTime() + 600 * 1000)
		});
	});

	it('should store the CIMD client name for metadata document clients', async () => {
		const cimdId = 'https://client.example/client.json';
		const resolveClient = jest.fn(async () => ({clientId: cimdId, clientName: 'CIMD Client', redirectUris: [redirectUri], metadataDocument: true}));
		const cimdFixture = await buildFixture({context: {resolveClient}});

		await authorizeHandler(cimdFixture.context, authorizeRequest({client_id: cimdId}));

		const {pending} = cimdFixture.upstream.begin.mock.calls[0][0];
		expect(pending.clientId).toBe(cimdId);
		expect(pending.clientName).toBe('CIMD Client');
	});

	it('should continue with the consent redirect when the upstream returns a user', async () => {
		fixture.upstream.begin.mockResolvedValueOnce({type: 'user', user: {id: 'user-1', displayName: 'User One'}});

		const response = await authorizeHandler(fixture.context, authorizeRequest());

		const stateId: string = fixture.upstream.begin.mock.calls[0][0].pending.stateId;
		expect(response.status).toBe(302);
		expect(response.headers.location).toBe(`${issuer}/oauth/consent?state=${stateId}`);
		const stored = await fixture.storage.getPendingAuthorization(stateId, fixedNow);
		expect(stored?.userId).toBe('user-1');
		expect(stored?.userDisplayName).toBe('User One');
	});

	it('should issue a code directly when the user already consented', async () => {
		await fixture.storage.upsertConsent({clientId, userId: 'user-1'});
		fixture.upstream.begin.mockResolvedValueOnce({type: 'user', user: {id: 'user-1'}});

		const response = await authorizeHandler(fixture.context, authorizeRequest());

		const location: URL = locationOf(response);
		expect(location.searchParams.get('code')).toBeTruthy();
		expect(location.searchParams.get('state')).toBe('client-state');
		expect(location.searchParams.get('iss')).toBe(issuer);
	});

	it('should delete pending and deny access when upstream begin throws an Error', async () => {
		fixture.upstream.begin.mockRejectedValueOnce(new Error('idp down'));

		const response = await authorizeHandler(fixture.context, authorizeRequest());

		const stateId: string = fixture.upstream.begin.mock.calls[0][0].pending.stateId;
		expect(await fixture.storage.getPendingAuthorization(stateId, fixedNow)).toBeNull();
		expect(locationOf(response).searchParams.get('error')).toBe('access_denied');
		expect(fixture.logger.error).toHaveBeenCalledWith('MCP upstream begin failed', {error: 'idp down'});
	});

	it('should stringify non-Error failures from upstream begin', async () => {
		fixture.upstream.begin.mockRejectedValueOnce('boom');

		await authorizeHandler(fixture.context, authorizeRequest());

		expect(fixture.logger.error).toHaveBeenCalledWith('MCP upstream begin failed', {error: 'boom'});
	});

	it('should not fail when no logger is configured', async () => {
		const quiet = await buildFixture({options: {logger: undefined}});
		await seedClient(quiet.storage);
		quiet.upstream.begin.mockRejectedValueOnce(new Error('idp down'));

		const response = await authorizeHandler(quiet.context, authorizeRequest());

		expect(locationOf(response).searchParams.get('error')).toBe('access_denied');
	});
});
