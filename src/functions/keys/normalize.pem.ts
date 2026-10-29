'use strict';

import pkcs1ToPkcs8 from './pkcs1.to.pkcs8';
import wrapPem from './wrap.pem';

const normalizePem = (value: string): string => {
	const pem: string = value.replace(/\\n/g, '\n').trim();
	if (!pem.includes('BEGIN RSA PRIVATE KEY')) return pem;
	const base64: string = pem.replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, '');
	return wrapPem(pkcs1ToPkcs8(Uint8Array.from(atob(base64), (char: string): number => char.charCodeAt(0))));
};
export default normalizePem;
