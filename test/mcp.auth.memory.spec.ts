'use strict';

import McpAuthMemory, {MemoryStorage} from '../src/mcp.auth.memory';

describe('mcp.auth.memory tests', () => {
	it('should be defined', () => {
		expect(McpAuthMemory).toBeDefined();
		expect(typeof McpAuthMemory).toBe('object');
	});

	it('should export a constructable MemoryStorage', () => {
		expect(typeof MemoryStorage).toBe('function');
		expect(new MemoryStorage()).toBeInstanceOf(MemoryStorage);
	});
});
