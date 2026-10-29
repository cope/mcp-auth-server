'use strict';

import parseUrl from './parse.url';

const loopbackHosts: string[] = ['localhost', '127.0.0.1'];
const dangerousSchemes: string[] = ['javascript:', 'data:', 'file:', 'vbscript:', 'blob:', 'about:'];

const isSafeMetadataRedirectUri = (redirectUri: unknown): boolean => {
	const url: URL | null = parseUrl(redirectUri);
	if (!url || 'string' !== typeof redirectUri || redirectUri.includes('#')) return false;
	if ('http:' === url.protocol) return loopbackHosts.includes(url.hostname);
	if ('https:' === url.protocol) return true;
	return !dangerousSchemes.includes(url.protocol);
};
export default isSafeMetadataRedirectUri;
