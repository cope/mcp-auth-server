'use strict';
/* eslint-disable sonarjs/no-hardcoded-ip */

import isPrivateIpv4 from '../../../src/functions/cimd/is.private.ipv4';

describe('is.private.ipv4 tests', () => {
	it('should be defined', () => {
		expect(isPrivateIpv4).toBeDefined();
	});

	it.each(['0.0.0.0', '10.1.2.3', '127.0.0.1', '169.254.169.254', '172.16.0.1', '172.31.255.255', '192.168.1.1', '100.64.0.1', '100.127.0.1', '224.0.0.1', '255.255.255.255'])(
		'should treat %s as private',
		(host) => {
			expect(isPrivateIpv4(host)).toBe(true);
		}
	);

	it.each(['8.8.8.8', '172.15.0.1', '172.32.0.1', '192.169.0.1', '100.63.0.1', '100.128.0.1', '169.253.0.1', '223.255.255.255'])('should treat %s as public', (host) => {
		expect(isPrivateIpv4(host)).toBe(false);
	});

	it('should return false for non-ipv4 hosts', () => {
		expect(isPrivateIpv4('example.com')).toBe(false);
	});
});
