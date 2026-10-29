'use strict';

import McpAuthEntra, {entraUpstream} from '../src/mcp.auth.entra';

describe('mcp.auth.entra tests', () => {
	it('should be defined', () => {
		expect(McpAuthEntra).toBeDefined();
		expect(typeof McpAuthEntra).toBe('object');
	});

	it('should export entraUpstream', () => {
		expect(typeof entraUpstream).toBe('function');
	});
});
