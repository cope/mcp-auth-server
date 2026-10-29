'use strict';

import isPrivateIpv4 from './is.private.ipv4';

const isPrivateIpv6 = (host: string): boolean => {
	const address: string = host.replace(/^\[|\]$/g, '').toLowerCase();
	if (!address.includes(':')) return false;
	const mapped: RegExpExecArray | null = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(address);
	if (mapped) return isPrivateIpv4(mapped[1] as string);
	return '::' === address || '::1' === address || /^f[cd]/.test(address) || /^fe[89ab]/.test(address) || address.startsWith('::ffff:');
};
export default isPrivateIpv6;
