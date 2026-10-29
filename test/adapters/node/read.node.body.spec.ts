'use strict';

import type {IncomingMessage} from 'node:http';
import {Readable} from 'node:stream';

import readNodeBody from '../../../src/adapters/node/read.node.body';

describe('read.node.body tests', () => {
	it('should be defined', () => {
		expect(readNodeBody).toBeDefined();
		expect(typeof readNodeBody).toBe('function');
	});

	it('should concatenate buffer chunks as utf8', async () => {
		const stream = Readable.from([Buffer.from('he'), Buffer.from('llo é')]);

		expect(await readNodeBody(stream as unknown as IncomingMessage)).toBe('hello é');
	});

	it('should accept string chunks', async () => {
		const stream = Readable.from(['a', 'b']);

		expect(await readNodeBody(stream as unknown as IncomingMessage)).toBe('ab');
	});

	it('should return an empty string for an empty stream', async () => {
		expect(await readNodeBody(Readable.from([]) as unknown as IncomingMessage)).toBe('');
	});
});
