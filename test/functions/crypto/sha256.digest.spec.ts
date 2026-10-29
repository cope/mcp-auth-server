'use strict';

import sha256Digest from '../../../src/functions/crypto/sha256.digest';

describe('sha256.digest tests', () => {
	it('should be defined', () => {
		expect(sha256Digest).toBeDefined();
		expect(typeof sha256Digest).toBe('function');
	});

	it('should return the 32 byte sha256 digest', async () => {
		const digest = await sha256Digest('abc');

		expect(digest).toBeInstanceOf(Uint8Array);
		expect(digest).toHaveLength(32);
		expect(Buffer.from(digest).toString('hex')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
	});
});
