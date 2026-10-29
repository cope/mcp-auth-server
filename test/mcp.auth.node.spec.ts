'use strict';

import McpAuthNode, {createNodeHandler, nodeSsrfGuard, parseNodeBody, readNodeBody, toNodeHttpRequest, writeNodeResponse} from '../src/mcp.auth.node';

describe('mcp.auth.node tests', () => {
	it('should be defined', () => {
		expect(McpAuthNode).toBeDefined();
		expect(typeof McpAuthNode).toBe('object');
	});

	it('should export the node adapters', () => {
		expect(typeof createNodeHandler).toBe('function');
		expect(typeof nodeSsrfGuard).toBe('function');
		expect(typeof parseNodeBody).toBe('function');
		expect(typeof readNodeBody).toBe('function');
		expect(typeof toNodeHttpRequest).toBe('function');
		expect(typeof writeNodeResponse).toBe('function');
	});
});
