'use strict';

import McpAuthExpress, {expressMiddleware} from '../src/mcp.auth.express';

describe('mcp.auth.express tests', () => {
	it('should be defined', () => {
		expect(McpAuthExpress).toBeDefined();
		expect(typeof McpAuthExpress).toBe('object');
	});

	it('should export expressMiddleware', () => {
		expect(typeof expressMiddleware).toBe('function');
	});
});
