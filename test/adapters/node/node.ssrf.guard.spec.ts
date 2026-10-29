'use strict';

/* eslint-disable sonarjs/no-hardcoded-ip */

import {lookup} from 'node:dns/promises';

import nodeSsrfGuard from '../../../src/adapters/node/node.ssrf.guard';

jest.mock('node:dns/promises', () => ({lookup: jest.fn()}));

const mockLookup = lookup as unknown as jest.Mock;

describe('node.ssrf.guard tests', () => {
	it('should be defined', () => {
		expect(nodeSsrfGuard).toBeDefined();
		expect(typeof nodeSsrfGuard).toBe('function');
	});

	it('should resolve for a public IPv4 address', async () => {
		mockLookup.mockResolvedValueOnce([{address: '93.184.216.34', family: 4}]);

		await expect(nodeSsrfGuard(new URL('https://client.example/meta.json'))).resolves.toBeUndefined();
		expect(mockLookup).toHaveBeenCalledWith('client.example', {all: true});
	});

	it('should throw for a private IPv4 address', async () => {
		mockLookup.mockResolvedValueOnce([{address: '10.0.0.5', family: 4}]);

		await expect(nodeSsrfGuard(new URL('https://client.example/meta.json'))).rejects.toThrow('client metadata host is not a public address');
	});

	it('should throw when any resolved address is private', async () => {
		mockLookup.mockResolvedValueOnce([
			{address: '93.184.216.34', family: 4},
			{address: '192.168.1.1', family: 4}
		]);

		await expect(nodeSsrfGuard(new URL('https://client.example/meta.json'))).rejects.toThrow();
	});

	it('should resolve for a public IPv6 address', async () => {
		mockLookup.mockResolvedValueOnce([{address: '2606:2800:220:1:248:1893:25c8:1946', family: 6}]);

		await expect(nodeSsrfGuard(new URL('https://client.example/meta.json'))).resolves.toBeUndefined();
	});

	it('should throw for a private IPv6 address', async () => {
		mockLookup.mockResolvedValueOnce([{address: 'fd00::1', family: 6}]);

		await expect(nodeSsrfGuard(new URL('https://client.example/meta.json'))).rejects.toThrow();
	});

	it('should strip brackets from IPv6 literal hostnames before lookup', async () => {
		mockLookup.mockResolvedValueOnce([{address: '::1', family: 6}]);

		await expect(nodeSsrfGuard(new URL('https://[::1]/meta.json'))).rejects.toThrow();
		expect(mockLookup).toHaveBeenCalledWith('::1', {all: true});
	});
});
