'use strict';

import tokenHandler from '../../src/handlers/token.handler';
import exchangeAuthorizationCode from '../../src/functions/server/exchange.authorization.code';
import rotateRefreshToken from '../../src/functions/server/rotate.refresh.token';
import {buildFixture, buildRequest, formRequest} from '../helpers/handler.fixtures';
import type {Fixture} from '../helpers/handler.fixtures';

jest.mock('../../src/functions/server/exchange.authorization.code');
jest.mock('../../src/functions/server/rotate.refresh.token');

const mockExchange = exchangeAuthorizationCode as jest.MockedFunction<typeof exchangeAuthorizationCode>;
const mockRotate = rotateRefreshToken as jest.MockedFunction<typeof rotateRefreshToken>;

describe('token.handler tests', () => {
	let fixture: Fixture;

	beforeEach(async () => {
		fixture = await buildFixture();
		mockExchange.mockResolvedValue({status: 200, headers: {}, body: 'exchanged'});
		mockRotate.mockResolvedValue({status: 200, headers: {}, body: 'rotated'});
	});

	it('should be defined', () => {
		expect(tokenHandler).toBeDefined();
		expect(typeof tokenHandler).toBe('function');
	});

	it('should answer 401 invalid_client when client_secret is sent', async () => {
		const response = await tokenHandler(fixture.context, formRequest({grant_type: 'authorization_code', client_secret: 'x'}));

		expect(response.status).toBe(401);
		expect((response.body as {error: string}).error).toBe('invalid_client');
		expect(mockExchange).not.toHaveBeenCalled();
	});

	it('should answer 401 invalid_client when an authorization header is sent', async () => {
		const response = await tokenHandler(fixture.context, formRequest({grant_type: 'refresh_token'}, {authorization: 'Basic abc'}));

		expect(response.status).toBe(401);
		expect(mockRotate).not.toHaveBeenCalled();
	});

	it('should delegate authorization_code grants', async () => {
		const params = {grant_type: 'authorization_code', code: 'c'};

		const response = await tokenHandler(fixture.context, formRequest(params));

		expect(response.body).toBe('exchanged');
		expect(mockExchange).toHaveBeenCalledWith(fixture.context, params);
	});

	it('should delegate refresh_token grants', async () => {
		const params = {grant_type: 'refresh_token', refresh_token: 'r'};

		const response = await tokenHandler(fixture.context, formRequest(params));

		expect(response.body).toBe('rotated');
		expect(mockRotate).toHaveBeenCalledWith(fixture.context, params);
	});

	it('should reject unsupported grant types', async () => {
		const response = await tokenHandler(fixture.context, formRequest({grant_type: 'password'}));

		expect(response.status).toBe(400);
		expect((response.body as {error: string}).error).toBe('unsupported_grant_type');
	});

	it('should reject a request without a body', async () => {
		const response = await tokenHandler(fixture.context, buildRequest({method: 'POST'}));

		expect((response.body as {error: string}).error).toBe('unsupported_grant_type');
	});
});
