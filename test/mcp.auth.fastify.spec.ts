'use strict';

import McpAuthFastify, {fastifyPlugin} from '../src/mcp.auth.fastify';

describe('mcp.auth.fastify tests', () => {
	it('should be defined', () => {
		expect(McpAuthFastify).toBeDefined();
		expect(typeof McpAuthFastify).toBe('object');
	});

	it('should export fastifyPlugin', () => {
		expect(typeof fastifyPlugin).toBe('function');
	});
});
