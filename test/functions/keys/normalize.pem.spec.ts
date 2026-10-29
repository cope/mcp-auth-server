'use strict';

import {generateKeyPairSync} from 'node:crypto';

import normalizePem from '../../../src/functions/keys/normalize.pem';

describe('normalize.pem tests', () => {
	const {privateKey} = generateKeyPairSync('rsa', {modulusLength: 2048});
	const pkcs8 = (privateKey.export({type: 'pkcs8', format: 'pem'}) as string).trim();
	const pkcs1 = (privateKey.export({type: 'pkcs1', format: 'pem'}) as string).trim();

	it('should be defined', () => {
		expect(normalizePem).toBeDefined();
		expect(typeof normalizePem).toBe('function');
	});

	it('should trim and return a pkcs8 pem unchanged', () => {
		expect(normalizePem(`  ${pkcs8}\n`)).toBe(pkcs8);
	});

	it('should expand escaped newlines', () => {
		expect(normalizePem(pkcs8.replace(/\n/g, '\\n'))).toBe(pkcs8);
	});

	it('should convert a pkcs1 pem to pkcs8', () => {
		expect(normalizePem(pkcs1)).toBe(pkcs8);
	});

	it('should convert an escaped pkcs1 pem to pkcs8', () => {
		expect(normalizePem(pkcs1.replace(/\n/g, '\\n'))).toBe(pkcs8);
	});
});
