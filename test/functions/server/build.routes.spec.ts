'use strict';

import buildRoutes from '../../../src/functions/server/build.routes';
import authorizationServerMetadataHandler from '../../../src/handlers/authorization.server.metadata.handler';
import authorizeHandler from '../../../src/handlers/authorize.handler';
import callbackHandler from '../../../src/handlers/callback.handler';
import consentDecisionHandler from '../../../src/handlers/consent.decision.handler';
import consentPageHandler from '../../../src/handlers/consent.page.handler';
import protectedResourceMetadataHandler from '../../../src/handlers/protected.resource.metadata.handler';
import registerHandler from '../../../src/handlers/register.handler';
import resumeHandler from '../../../src/handlers/resume.handler';
import revokeHandler from '../../../src/handlers/revoke.handler';
import tokenHandler from '../../../src/handlers/token.handler';
import {buildContext} from '../../helpers/server.fixtures';

jest.mock('../../../src/handlers/authorization.server.metadata.handler');
jest.mock('../../../src/handlers/authorize.handler');
jest.mock('../../../src/handlers/callback.handler');
jest.mock('../../../src/handlers/consent.decision.handler');
jest.mock('../../../src/handlers/consent.page.handler');
jest.mock('../../../src/handlers/protected.resource.metadata.handler');
jest.mock('../../../src/handlers/register.handler');
jest.mock('../../../src/handlers/resume.handler');
jest.mock('../../../src/handlers/revoke.handler');
jest.mock('../../../src/handlers/token.handler');

const request = {method: 'GET', path: '/x', query: {}, headers: {}};
const listing = (routes: {method: string; path: string}[]): string[] => routes.map((route) => `${route.method} ${route.path}`);

describe('build.routes tests', () => {
	it('should be defined', () => {
		expect(buildRoutes).toBeDefined();
		expect(typeof buildRoutes).toBe('function');
	});

	it('should build the full route list without a base path', async () => {
		const context = await buildContext({options: {upstream: {begin: jest.fn(), callback: jest.fn(), resume: jest.fn()}}});

		const routes = buildRoutes(context);

		expect(listing(routes)).toEqual([
			'GET /.well-known/oauth-protected-resource',
			'GET /.well-known/oauth-protected-resource/mcp',
			'GET /.well-known/oauth-authorization-server',
			'GET /.well-known/openid-configuration',
			'POST /register',
			'GET /authorize',
			'GET /oauth/callback',
			'GET /oauth/resume',
			'GET /oauth/consent',
			'POST /oauth/consent',
			'POST /token',
			'POST /revoke'
		]);
	});

	it('should omit register when registration is disabled and callback/resume when upstream lacks them', async () => {
		const context = await buildContext({context: {registrationEnabled: false}});

		const names = buildRoutes(context).map((route) => route.name);

		expect(names).not.toContain('register');
		expect(names).not.toContain('callback');
		expect(names).not.toContain('resume');
		expect(names).toEqual(expect.arrayContaining(['authorize', 'consent', 'token', 'revoke', 'metadata']));
	});

	it('should omit the protected-resource alias when the resource has no path', async () => {
		const context = await buildContext({options: {resource: 'https://api.example.com/'}});

		const paths = buildRoutes(context).map((route) => route.path);

		expect(paths.filter((path) => path.startsWith('/.well-known/oauth-protected-resource'))).toEqual(['/.well-known/oauth-protected-resource']);
	});

	it('should add basePath aliases for the well-known documents and prefix routes with the base path', async () => {
		const context = await buildContext({context: {basePath: '/tenant', callbackPath: '/cb'}, options: {upstream: {begin: jest.fn(), callback: jest.fn()}}});

		const paths = listing(buildRoutes(context));

		expect(paths).toEqual(
			expect.arrayContaining([
				'GET /.well-known/oauth-authorization-server',
				'GET /.well-known/oauth-authorization-server/tenant',
				'GET /tenant/.well-known/oauth-authorization-server',
				'GET /.well-known/openid-configuration/tenant',
				'GET /tenant/.well-known/openid-configuration',
				'POST /tenant/register',
				'GET /tenant/authorize',
				'GET /tenant/cb',
				'POST /tenant/token',
				'POST /tenant/revoke'
			])
		);
	});

	it('should delegate each route to its handler with the context and request', async () => {
		const context = await buildContext({options: {upstream: {begin: jest.fn(), callback: jest.fn(), resume: jest.fn()}}});
		const marker = {status: 200, headers: {}, body: 'ok'};
		const handlers = [
			registerHandler,
			authorizeHandler,
			callbackHandler,
			resumeHandler,
			consentPageHandler,
			consentDecisionHandler,
			tokenHandler,
			revokeHandler
		] as jest.Mock[];
		for (const handler of handlers) handler.mockResolvedValue(marker);
		const metadataHandlers = [protectedResourceMetadataHandler, authorizationServerMetadataHandler] as jest.Mock[];
		for (const handler of metadataHandlers) handler.mockResolvedValue(marker);

		const routes = buildRoutes(context);
		for (const route of routes) expect(await route.handler(request)).toBe(marker);

		for (const handler of handlers) expect(handler).toHaveBeenCalledWith(context, request);
		expect(consentPageHandler).toHaveBeenCalledTimes(1);
		expect(consentDecisionHandler).toHaveBeenCalledTimes(1);
		expect(protectedResourceMetadataHandler).toHaveBeenCalledWith(context);
		expect(authorizationServerMetadataHandler).toHaveBeenCalledWith(context);
	});
});
