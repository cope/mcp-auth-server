'use strict';

import McpAuthFetch, {createFetchHandler, toHttpRequest, toResponse} from '../src/mcp.auth.fetch';

describe('mcp.auth.fetch tests', () => {
	it('should be defined', () => {
		expect(McpAuthFetch).toBeDefined();
		expect(typeof McpAuthFetch).toBe('object');
	});

	it('should export the fetch adapters', () => {
		expect(typeof createFetchHandler).toBe('function');
		expect(typeof toHttpRequest).toBe('function');
		expect(typeof toResponse).toBe('function');
	});
});
