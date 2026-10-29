'use strict';

const toBase64Url = (bytes: Uint8Array): string => {
	let binary: string = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return (btoa(binary).split('=')[0] as string).replaceAll('+', '-').replaceAll('/', '_');
};
export default toBase64Url;
