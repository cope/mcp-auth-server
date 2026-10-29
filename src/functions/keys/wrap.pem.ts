'use strict';

const wrapPem = (der: Uint8Array): string => {
	let binary = '';
	for (const byte of der) binary += String.fromCharCode(byte);
	const lines: string[] = btoa(binary).match(/.{1,64}/g) ?? [];
	return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----`;
};
export default wrapPem;
