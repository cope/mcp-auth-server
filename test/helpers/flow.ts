'use strict';

import {createHash, randomBytes} from 'node:crypto';

export type Sent = {status: number; headers: Record<string, string>; body: any; text: string};
export type Send = (request: {method: string; url: string; headers?: Record<string, string>; form?: Record<string, string>; json?: unknown}) => Promise<Sent>;

export type FlowContext = {
	issuer: string;
	resource: string;
	send: Send;
	mcp: (headers: Record<string, string>) => Promise<Sent>;
	signIn: (upstreamLocation: string) => Promise<{next: string; headers?: Record<string, string>}>;
	registration: 'dcr' | 'cimd';
	cimdClientId?: string;
	redirectUri?: string;
	sessionHeaders?: Record<string, string>;
	expectedUserId: string;
};

export const redirectUri = 'http://localhost:8123/callback';

const pkce = () => {
	const verifier = randomBytes(32).toString('base64url');
	return {verifier, challenge: createHash('sha256').update(verifier).digest('base64url')};
};

export const location = (sent: Sent): URL => {
	expect(sent.status).toBe(302);
	return new URL(sent.headers.location as string);
};

export const registerClient = async (context: FlowContext): Promise<string> => {
	if ('cimd' === context.registration) return context.cimdClientId as string;
	const registered = await context.send({
		method: 'POST',
		url: `${context.issuer}/register`,
		json: {client_name: 'Test Client', redirect_uris: [redirectUri], application_type: 'native'}
	});
	expect(registered.status).toBe(201);
	expect(registered.body.application_type).toBe('native');
	return registered.body.client_id;
};

export const authorize = async (context: FlowContext, clientId: string, overrides: Record<string, string> = {}) => {
	const {verifier, challenge} = pkce();
	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: redirectUri,
		response_type: 'code',
		code_challenge: challenge,
		code_challenge_method: 'S256',
		resource: context.resource,
		state: 'client-state-1',
		...overrides
	});
	const sent = await context.send({method: 'GET', url: `${context.issuer}/authorize?${params.toString()}`, headers: context.sessionHeaders});
	return {sent, verifier};
};

export const finishSignIn = async (context: FlowContext, authorizeResponse: Sent): Promise<Sent> => {
	const upstreamLocation = location(authorizeResponse).toString();
	const {next, headers} = await context.signIn(upstreamLocation);
	if (headers) context.sessionHeaders = {...context.sessionHeaders, ...headers};
	return context.send({method: 'GET', url: next, headers: context.sessionHeaders});
};

export const consentAndGetCode = async (context: FlowContext, afterSignIn: Sent, decision: 'approve' | 'deny' = 'approve'): Promise<URL> => {
	let target = location(afterSignIn);
	if (target.pathname.endsWith('/oauth/consent')) {
		const page = await context.send({method: 'GET', url: target.toString(), headers: context.sessionHeaders});
		expect(page.status).toBe(200);
		expect(page.headers['x-frame-options']).toBe('DENY');
		expect(page.headers['content-security-policy']).toBe("default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'");
		expect(page.headers['cache-control']).toBe('no-store');
		if ('cimd' === context.registration) expect(page.text).toContain(new URL(context.cimdClientId as string).host);

		const posted = await context.send({
			method: 'POST',
			url: `${context.issuer}/oauth/consent`,
			headers: context.sessionHeaders,
			form: {state: target.searchParams.get('state') as string, decision}
		});
		target = location(posted);
	}
	return target;
};

export const exchange = (context: FlowContext, clientId: string, code: string, verifier: string): Promise<Sent> =>
	context.send({
		method: 'POST',
		url: `${context.issuer}/token`,
		form: {grant_type: 'authorization_code', code, client_id: clientId, redirect_uri: redirectUri, code_verifier: verifier, resource: context.resource}
	});

export const refresh = (context: FlowContext, clientId: string, refreshToken: string): Promise<Sent> =>
	context.send({method: 'POST', url: `${context.issuer}/token`, form: {grant_type: 'refresh_token', refresh_token: refreshToken, client_id: clientId}});

export const signInAndGetTokens = async (context: FlowContext) => {
	const clientId = await registerClient(context);
	const {sent, verifier} = await authorize(context, clientId);
	const next = location(sent);
	const skipsUpstream = next.pathname.endsWith('/oauth/consent') || next.toString().startsWith(redirectUri);
	const afterSignIn = skipsUpstream ? sent : await finishSignIn(context, sent);
	const target = await consentAndGetCode(context, afterSignIn);
	expect(target.searchParams.get('iss')).toBe(context.issuer);
	expect(target.searchParams.get('state')).toBe('client-state-1');
	const code = target.searchParams.get('code') as string;
	const tokens = await exchange(context, clientId, code, verifier);
	return {clientId, code, verifier, tokens};
};

export const runFullFlow = async (context: FlowContext): Promise<void> => {
	const protectedResource = await context.send({method: 'GET', url: `${context.issuer}/.well-known/oauth-protected-resource`});
	expect(protectedResource.body).toEqual({resource: context.resource, authorization_servers: [context.issuer], bearer_methods_supported: ['header']});

	const metadata = await context.send({method: 'GET', url: `${context.issuer}/.well-known/oauth-authorization-server`});
	expect(metadata.body).toMatchObject({
		issuer: context.issuer,
		code_challenge_methods_supported: ['S256'],
		token_endpoint_auth_methods_supported: ['none'],
		authorization_response_iss_parameter_supported: true,
		client_id_metadata_document_supported: true
	});

	const unauthenticated = await context.mcp({});
	expect(unauthenticated.status).toBe(401);
	expect(unauthenticated.headers['www-authenticate']).toBe(`Bearer resource_metadata="${context.issuer}/.well-known/oauth-protected-resource"`);

	const {clientId, code, verifier, tokens} = await signInAndGetTokens(context);
	expect(tokens.status).toBe(200);
	expect(tokens.headers['cache-control']).toBe('no-store');
	expect(tokens.body).toMatchObject({token_type: 'Bearer', expires_in: 3600});

	const replayedCode = await exchange(context, clientId, code, verifier);
	expect(replayedCode.status).toBe(400);
	expect(replayedCode.body.error).toBe('invalid_grant');

	const authorized = await context.mcp({authorization: `Bearer ${tokens.body.access_token}`});
	expect(authorized.status).toBe(200);
	expect(authorized.body.userId).toBe(context.expectedUserId);

	const badToken = await context.mcp({authorization: 'Bearer not.a.jwt'});
	expect(badToken.status).toBe(401);
	expect(badToken.headers['www-authenticate']).toContain('error="invalid_token"');

	const refreshed = await refresh(context, clientId, tokens.body.refresh_token);
	expect(refreshed.status).toBe(200);
	expect(refreshed.body.refresh_token).not.toBe(tokens.body.refresh_token);

	const replayed = await refresh(context, clientId, tokens.body.refresh_token);
	expect(replayed.status).toBe(400);
	expect(replayed.body.error).toBe('invalid_grant');

	const familyRevoked = await refresh(context, clientId, refreshed.body.refresh_token);
	expect(familyRevoked.status).toBe(400);

	const second = await signInAndGetTokens(context);
	const revoked = await context.send({method: 'POST', url: `${context.issuer}/revoke`, form: {token: second.tokens.body.refresh_token, client_id: second.clientId}});
	expect(revoked.status).toBe(200);
	expect(revoked.body).toEqual({});
	expect((await refresh(context, second.clientId, second.tokens.body.refresh_token)).status).toBe(400);

	const unknownRevoke = await context.send({method: 'POST', url: `${context.issuer}/revoke`, form: {token: 'nope', client_id: second.clientId}});
	expect(unknownRevoke.status).toBe(200);
};
