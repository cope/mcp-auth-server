'use strict';

import buildUpstreamContext from '../../../src/functions/server/build.upstream.context';
import {buildContext, buildPending, issuerUrl} from '../../helpers/server.fixtures';

describe('build.upstream.context tests', () => {
	it('should be defined', () => {
		expect(buildUpstreamContext).toBeDefined();
		expect(typeof buildUpstreamContext).toBe('function');
	});

	it('should build callback and resume urls with an encoded state', async () => {
		const context = await buildContext();
		const request = {method: 'GET', path: '/authorize', query: {}, headers: {}};
		const pending = buildPending({stateId: 'a b&c=d'});

		const result = buildUpstreamContext(context, request, pending);

		expect(result).toEqual({
			request,
			pending,
			issuer: issuerUrl,
			callbackUrl: `${issuerUrl}/oauth/callback`,
			resumeUrl: `${issuerUrl}/oauth/resume?state=a%20b%26c%3Dd`
		});
	});
});
