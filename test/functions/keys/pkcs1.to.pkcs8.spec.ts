'use strict';

import {generateKeyPairSync} from 'node:crypto';

import pkcs1ToPkcs8 from '../../../src/functions/keys/pkcs1.to.pkcs8';

describe('pkcs1.to.pkcs8 tests', () => {
	it('should be defined', () => {
		expect(pkcs1ToPkcs8).toBeDefined();
		expect(typeof pkcs1ToPkcs8).toBe('function');
	});

	it('should produce the same der as a native pkcs8 export', () => {
		const {privateKey} = generateKeyPairSync('rsa', {modulusLength: 2048});
		const pkcs1 = privateKey.export({type: 'pkcs1', format: 'der'});
		const pkcs8 = privateKey.export({type: 'pkcs8', format: 'der'});

		expect(Buffer.from(pkcs1ToPkcs8(new Uint8Array(pkcs1)))).toEqual(pkcs8);
	});

	it('should wrap short input using short form lengths', () => {
		const expected = [0x30, 0x17, 0x02, 0x01, 0x00, 0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00, 0x04, 0x03, 1, 2, 3];

		expect(Array.from(pkcs1ToPkcs8(new Uint8Array([1, 2, 3])))).toEqual(expected);
	});
});
