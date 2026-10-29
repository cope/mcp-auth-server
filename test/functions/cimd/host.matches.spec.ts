'use strict';

import hostMatches from '../../../src/functions/cimd/host.matches';

describe('host.matches tests', () => {
	it('should be defined', () => {
		expect(hostMatches).toBeDefined();
	});

	it('should match exact hosts', () => {
		expect(hostMatches('a.example', ['a.example'])).toBe(true);
		expect(hostMatches('b.example', ['a.example'])).toBe(false);
	});

	it('should match wildcard patterns by suffix', () => {
		expect(hostMatches('app.example', ['*.example'])).toBe(true);
		expect(hostMatches('example', ['*.example'])).toBe(false);
		expect(hostMatches('app.other', ['*.example'])).toBe(false);
	});

	it('should not match with an empty list', () => {
		expect(hostMatches('a.example', [])).toBe(false);
	});
});
