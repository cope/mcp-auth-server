'use strict';

import isPrivateIpv4 from './is.private.ipv4';
import isPrivateIpv6 from './is.private.ipv6';

const internalName: RegExp = /(^|\.)(localhost|local|internal|localdomain|home\.arpa)$/;

const assertPublicHost = (url: URL): void => {
	const host: string = url.hostname.toLowerCase();
	if (internalName.test(host) || isPrivateIpv4(host) || isPrivateIpv6(host)) throw new Error('client metadata host is not a public address');
};
export default assertPublicHost;
