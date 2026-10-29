'use strict';

import {createHash} from 'node:crypto';

import exchangeAuthorizationCode from '../../../src/functions/server/exchange.authorization.code';
import issueTokens from '../../../src/functions/server/issue.tokens';
import {buildContext, fixedNow, resourceUrl} from '../../helpers/server.fixtures';

jest.mock('../../../src/functions/server/issue.tokens');

const mockIssueTokens = issueTokens as jest.MockedFunction<typeof issueTokens>;
const sha256Hex = (value: string): string => createHash('sha256').update(value).digest('hex');
const verifier: string = 'v'.repeat(43);
const challenge: string = createHash('sha256').update(verifier).digest('base64url');
const redirectUri: string = 'https://client.example.com/cb';

const params = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
	code: 'code-1',
	client_id: 'client-1',
	redirect_uri: redirectUri,
	code_verifier: verifier,
	...overrides
});

const seed = async (context: any, overrides: Record<string, unknown> = {}) =>
	context.options.storage.saveAuthorizationCode({
		codeHash: sha256Hex('code-1'),
		clientId: 'client-1',
		redirectUri,
		codeChallenge: challenge,
		resource: resourceUrl,
		userId: 'u1',
		expiresAt: new Date(fixedNow.getTime() + 60000),
		...overrides
	});

describe('exchange.authorization.code tests', () => {
	beforeEach(() => {
		mockIssueTokens.mockResolvedValue({status: 200, headers: {}, body: {access_token: 'a'}});
	});

	it('should be defined', () => {
		expect(exchangeAuthorizationCode).toBeDefined();
		expect(typeof exchangeAuthorizationCode).toBe('function');
	});

	it.each(['code', 'client_id', 'redirect_uri', 'code_verifier'])('should require %s', async (name: string) => {
		const context = await buildContext();

		const response = await exchangeAuthorizationCode(context, params({[name]: undefined}));

		expect(response.status).toBe(400);
		expect((response.body as any).error).toBe('invalid_request');
		expect(response.headers['cache-control']).toBe('no-store');
	});

	it.each(['short', 'a'.repeat(129), `${'a'.repeat(43)}!`])('should reject a malformed code_verifier without consuming the code', async (bad: string) => {
		const context = await buildContext();
		await seed(context);

		const response = await exchangeAuthorizationCode(context, params({code_verifier: bad}));

		expect(response.body).toEqual({error: 'invalid_grant', error_description: 'code_verifier is malformed'});
		expect(await context.options.storage.claimAuthorizationCode(sha256Hex('code-1'), fixedNow)).not.toBeNull();
	});

	it('should reject an unknown code', async () => {
		const context = await buildContext();

		const response = await exchangeAuthorizationCode(context, params());

		expect((response.body as any).error_description).toBe('authorization code is invalid, expired or already used');
		expect(mockIssueTokens).not.toHaveBeenCalled();
	});

	it('should reject an expired code', async () => {
		const context = await buildContext();
		await seed(context, {expiresAt: fixedNow});

		const response = await exchangeAuthorizationCode(context, params());

		expect((response.body as any).error).toBe('invalid_grant');
	});

	it('should issue tokens once and reject the replayed code', async () => {
		const context = await buildContext();
		await seed(context);

		const first = await exchangeAuthorizationCode(context, params());
		const second = await exchangeAuthorizationCode(context, params());

		expect(first.status).toBe(200);
		expect(mockIssueTokens).toHaveBeenCalledTimes(1);
		expect(mockIssueTokens).toHaveBeenCalledWith(context, 'client-1', 'u1', expect.any(String), new Date(fixedNow.getTime() + 2592000 * 1000));
		expect((second.body as any).error).toBe('invalid_grant');
	});

	it('should accept a matching resource parameter', async () => {
		const context = await buildContext();
		await seed(context);

		const response = await exchangeAuthorizationCode(context, params({resource: resourceUrl}));

		expect(response.status).toBe(200);
	});

	it.each([
		['client_id', {client_id: 'other-client'}],
		['redirect_uri', {redirect_uri: 'https://client.example.com/other'}],
		['code_verifier', {code_verifier: 'w'.repeat(43)}],
		['resource', {resource: 'https://other.example.com/mcp'}]
	])('should reject a mismatched %s', async (_name: string, override: Record<string, unknown>) => {
		const context = await buildContext();
		await seed(context);

		const response = await exchangeAuthorizationCode(context, params(override));

		expect(response.body).toEqual({error: 'invalid_grant', error_description: 'authorization code does not match the request'});
		expect(mockIssueTokens).not.toHaveBeenCalled();
	});
});
