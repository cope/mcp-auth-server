'use strict';

import type RedirectPolicyType from '../../types/redirect.policy.type';
import parseUrl from './parse.url';

const loopbackHosts: string[] = ['localhost', '127.0.0.1'];

const isAllowedRedirectUri = (redirectUri: unknown, policy: RedirectPolicyType): boolean => {
	const url: URL | null = parseUrl(redirectUri);
	if (!url || url.hash || 'string' !== typeof redirectUri || redirectUri.includes('#')) return false;
	if ('http:' === url.protocol) return loopbackHosts.includes(url.hostname);
	if ('https:' === url.protocol) return policy.httpsHosts.includes(url.hostname);
	return policy.customSchemes.some((scheme: string): boolean => redirectUri.startsWith(scheme));
};
export default isAllowedRedirectUri;
