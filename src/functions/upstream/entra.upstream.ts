'use strict';

import type IUpstream from '../../types/i.upstream';
import oidcUpstream from './oidc.upstream';

type EntraUpstreamOptionsType = {tenantId: string; clientId: string; clientSecret: string; scope?: string; fetch?: typeof fetch; now?: () => Date};

const entraUpstream = (options: EntraUpstreamOptionsType): IUpstream =>
	oidcUpstream({
		discoveryUrl: `https://login.microsoftonline.com/${encodeURIComponent(options.tenantId)}/v2.0/.well-known/openid-configuration`,
		clientId: options.clientId,
		clientSecret: options.clientSecret,
		scope: options.scope ?? 'openid profile email',
		fetch: options.fetch,
		now: options.now
	});
export default entraUpstream;
