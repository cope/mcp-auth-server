'use strict';

import sha256Hex from '../../../src/functions/crypto/sha256.hex';

describe('sha256.hex tests', () => {
	it('should be defined', () => {
		expect(sha256Hex).toBeDefined();
		expect(typeof sha256Hex).toBe('function');
	});

	it('should return the lowercase hex digest', async () => {
		expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
	});

	it('should zero pad every byte', async () => {
		expect(await sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
	});
});
