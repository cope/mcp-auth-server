'use strict';

import appSessionUpstream from '../../../src/functions/upstream/app.session.upstream';
import type HttpRequestType from '../../../src/types/http.request.type';
import type UpstreamContextType from '../../../src/types/upstream.context.type';

const request: HttpRequestType = {method: 'GET', path: '/', query: {}, headers: {}};
const context = {request, resumeUrl: 'https://mcp.test/resume'} as unknown as UpstreamContextType;

describe('app.session.upstream tests', () => {
	const getSignedInUser = jest.fn();
	const signInUrl = jest.fn((returnTo: string) => `https://app.test/login?return=${encodeURIComponent(returnTo)}`);
	const upstream = appSessionUpstream({getSignedInUser, signInUrl});

	it('should be defined', () => {
		expect(appSessionUpstream).toBeDefined();
		expect(upstream.begin).toBeDefined();
	});

	it('should begin with the user when signed in', async () => {
		const user = {id: 'u1', displayName: 'User'};
		getSignedInUser.mockResolvedValue(user);
		expect(await upstream.begin(context)).toEqual({type: 'user', user});
		expect(getSignedInUser).toHaveBeenCalledWith(request);
	});

	it('should begin with a redirect when not signed in', async () => {
		getSignedInUser.mockReturnValue(null);
		expect(await upstream.begin(context)).toEqual({type: 'redirect', url: 'https://app.test/login?return=https%3A%2F%2Fmcp.test%2Fresume'});
		expect(signInUrl).toHaveBeenCalledWith('https://mcp.test/resume');
	});

	it('should resume with the user', async () => {
		getSignedInUser.mockResolvedValue({id: 'u1'});
		expect(await upstream.resume!(context)).toEqual({id: 'u1'});
	});

	it('should resume with null when there is no session', async () => {
		getSignedInUser.mockResolvedValue(undefined);
		expect(await upstream.resume!(context)).toBeNull();
	});

	it('should verify a matching user', async () => {
		getSignedInUser.mockResolvedValue({id: 'u1'});
		expect(await upstream.verifyUser!(request, 'u1')).toBe(true);
	});

	it('should not verify a mismatched user', async () => {
		getSignedInUser.mockResolvedValue({id: 'u2'});
		expect(await upstream.verifyUser!(request, 'u1')).toBe(false);
	});

	it('should not verify without a session', async () => {
		getSignedInUser.mockResolvedValue(null);
		expect(await upstream.verifyUser!(request, 'u1')).toBe(false);
	});
});
