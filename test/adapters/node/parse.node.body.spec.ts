'use strict';

import type {IncomingMessage} from 'node:http';
import {Readable} from 'node:stream';

import parseNodeBody from '../../../src/adapters/node/parse.node.body';

describe('parse.node.body tests', () => {
	const fakeRequest = (method: string, headers: Record<string, string>, body: string): IncomingMessage =>
		Object.assign(Readable.from([Buffer.from(body)]), {method, headers}) as unknown as IncomingMessage;

	it('should be defined', () => {
		expect(parseNodeBody).toBeDefined();
		expect(typeof parseNodeBody).toBe('function');
	});

	it('should return the pre-parsed body untouched', async () => {
		const preParsed = {a: 1};

		expect(await parseNodeBody(fakeRequest('POST', {}, 'ignored'), preParsed)).toBe(preParsed);
	});

	it('should return undefined for GET requests', async () => {
		expect(await parseNodeBody(fakeRequest('GET', {}, 'x=1'))).toBeUndefined();
	});

	it('should return undefined for HEAD requests', async () => {
		expect(await parseNodeBody(fakeRequest('HEAD', {}, 'x=1'))).toBeUndefined();
	});

	it('should parse form bodies', async () => {
		expect(await parseNodeBody(fakeRequest('POST', {'content-type': 'application/x-www-form-urlencoded'}, 'a=1&b=2'))).toEqual({a: '1', b: '2'});
	});

	it('should parse JSON bodies', async () => {
		expect(await parseNodeBody(fakeRequest('POST', {'content-type': 'application/json'}, '{"a":1}'))).toEqual({a: 1});
	});
});
