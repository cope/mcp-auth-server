'use strict';

const describeRedirectTarget = (redirectUri: string): string => {
	const url: URL = new URL(redirectUri);
	return url.protocol.startsWith('http') ? url.host : `${url.protocol}//${url.host}`;
};
export default describeRedirectTarget;
