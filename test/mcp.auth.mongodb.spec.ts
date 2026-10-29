'use strict';

import McpAuthMongodb, {MongoStorage} from '../src/mcp.auth.mongodb';

describe('mcp.auth.mongodb tests', () => {
	it('should be defined', () => {
		expect(McpAuthMongodb).toBeDefined();
		expect(typeof McpAuthMongodb).toBe('object');
	});

	it('should export the public api', () => {
		expect(MongoStorage).toBeDefined();
	});
});
