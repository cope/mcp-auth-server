'use strict';

import {parseBody} from '../../src/mcp.auth.server';
import type {HttpResponseType} from '../../src/mcp.auth.server';
import {makeApp} from './app';
import type {FlowContext, Send, Sent} from './flow';

export const toSent = (response: HttpResponseType): Sent => {
	const body = response.body;
	return {
		status: response.status,
		headers: response.headers,
		body: 'string' === typeof body ? undefined : body,
		text: 'string' === typeof body ? body : JSON.stringify(body ?? '')
	};
};

export const coreContext = async (kind: 'oidc' | 'session', registration: 'dcr' | 'cimd'): Promise<FlowContext> => {
	const app = await makeApp(kind);
	const send: Send = async ({method, url, headers = {}, form, json}) => {
		const target = new URL(url);
		const request = {
			method,
			path: target.pathname,
			query: Object.fromEntries(target.searchParams),
			headers: Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])),
			body: form ? parseBody('application/x-www-form-urlencoded', new URLSearchParams(form).toString()) : json
		};
		return toSent(await app.auth.handle(request));
	};
	const mcp = async (headers: Record<string, string>): Promise<Sent> => {
		const result = await app.auth.authenticate(headers, {jsonrpc: '2.0', id: 7, method: 'ping'});
		if ('user' in result) return {status: 200, headers: {}, body: {userId: result.user.id}, text: ''};
		return {status: result.status, headers: result.headers, body: result.body, text: ''};
	};
	return {...app.context, registration, send, mcp};
};
