'use strict';
/* eslint-disable sonarjs/no-hardcoded-ip */

import isPrivateIpv6 from '../../../src/functions/cimd/is.private.ipv6';

describe('is.private.ipv6 tests', () => {
	it('should be defined', () => {
		expect(isPrivateIpv6).toBeDefined();
	});

	it.each(['::', '::1', '[::1]', 'fc00::1', 'fd12::1', 'fe80::1', 'febf::1', '::ffff:10.0.0.1', '::ffff:7f00:1', '[FE80::1]'])('should treat %s as private', (host) => {
		expect(isPrivateIpv6(host)).toBe(true);
	});

	it.each(['2001:db8::1', '[2606:4700::1]', '::ffff:8.8.8.8'])('should treat %s as public', (host) => {
		expect(isPrivateIpv6(host)).toBe(false);
	});

	it('should return false for non-ipv6 hosts', () => {
		expect(isPrivateIpv6('example.com')).toBe(false);
	});
});
