'use strict';

import buildRedirect from './build.redirect';

const buildErrorRedirect = (redirectUri: string, issuer: string, error: string, description: string, state?: string): string =>
	buildRedirect(redirectUri, issuer, {error, error_description: description, state});
export default buildErrorRedirect;
