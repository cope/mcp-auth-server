'use strict';

import readLimited from '../../../src/functions/cimd/read.limited';

const streamOf = (...chunks: string[]): ReadableStream<Uint8Array> => {
	const encoder = new TextEncoder();
	return new ReadableStream({
		start(controller) {
			for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
			controller.close();
		}
	});
};

describe('read.limited tests', () => {
	it('should be defined', () => {
		expect(readLimited).toBeDefined();
	});

	it('should read a multi-chunk body', async () => {
		expect(await readLimited(new Response(streamOf('hel', 'lo')), 100)).toBe('hello');
	});

	it('should return an empty string when there is no body', async () => {
		expect(await readLimited(new Response(null), 100)).toBe('');
	});

	it('should reject when content-length exceeds the limit', async () => {
		const response = new Response('x', {headers: {'content-length': '1000'}});
		await expect(readLimited(response, 10)).rejects.toThrow('client metadata document is too large');
	});

	it('should reject when the streamed body exceeds the limit', async () => {
		await expect(readLimited(new Response(streamOf('abcdef', 'ghijkl')), 10)).rejects.toThrow('client metadata document is too large');
	});
});
