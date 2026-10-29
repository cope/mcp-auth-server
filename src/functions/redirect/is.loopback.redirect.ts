'use strict';

import parseUrl from './parse.url';

const loopbackHosts: string[] = ['localhost', '127.0.0.1'];

const isLoopbackRedirect = (redirectUri: string): boolean => {
	const url: URL | null = parseUrl(redirectUri);
	return !!url && 'http:' === url.protocol && loopbackHosts.includes(url.hostname);
};
export default isLoopbackRedirect;
