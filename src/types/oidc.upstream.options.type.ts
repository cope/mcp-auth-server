'use strict';

type OidcUpstreamOptionsType = {
	discoveryUrl: string;
	clientId: string;
	clientSecret: string;
	scope?: string;
	fetch?: typeof fetch;
	now?: () => Date;
};
export default OidcUpstreamOptionsType;
