'use strict';

const buildRedirect = (redirectUri: string, issuer: string, params: Record<string, string | undefined>): string => {
	const target: URL = new URL(redirectUri);
	for (const [key, value] of Object.entries(params)) if (value) target.searchParams.set(key, value);
	target.searchParams.set('iss', issuer);
	return target.toString();
};
export default buildRedirect;
