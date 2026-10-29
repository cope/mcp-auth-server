'use strict';

import McpAuthKoa, {koaMiddleware} from '../src/mcp.auth.koa';

describe('mcp.auth.koa tests', () => {
	it('should be defined', () => {
		expect(McpAuthKoa).toBeDefined();
		expect(typeof McpAuthKoa).toBe('object');
	});

	it('should export koaMiddleware', () => {
		expect(typeof koaMiddleware).toBe('function');
	});
});
