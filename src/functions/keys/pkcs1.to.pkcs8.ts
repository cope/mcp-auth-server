'use strict';

import derLength from './der.length';

const rsaEncryptionAlgorithm: number[] = [0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00];

const pkcs1ToPkcs8 = (pkcs1: Uint8Array): Uint8Array => {
	const octetString: number[] = [0x04, ...derLength(pkcs1.length), ...pkcs1];
	const body: number[] = [0x02, 0x01, 0x00, ...rsaEncryptionAlgorithm, ...octetString];
	return Uint8Array.from([0x30, ...derLength(body.length), ...body]);
};
export default pkcs1ToPkcs8;
