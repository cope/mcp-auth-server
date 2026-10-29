'use strict';

import McpAuthSqlite, {sqliteStorage, sqliteSchema, fromBetterSqlite3, fromNodeSqlite, fromBunSqlite, fromD1, SqlStorage} from '../src/mcp.auth.sqlite';

describe('mcp.auth.sqlite tests', () => {
	it('should be defined', () => {
		expect(McpAuthSqlite).toBeDefined();
		expect(typeof McpAuthSqlite).toBe('object');
	});

	it('should export the public api', () => {
		expect(sqliteStorage).toBeDefined();
		expect(sqliteSchema).toBeDefined();
		expect(fromBetterSqlite3).toBeDefined();
		expect(fromNodeSqlite).toBeDefined();
		expect(fromBunSqlite).toBeDefined();
		expect(fromD1).toBeDefined();
		expect(SqlStorage).toBeDefined();
	});

	it('should create a sqlite storage', async () => {
		const executor = jest.fn().mockResolvedValue([]);
		const storage = sqliteStorage(executor);
		expect(storage).toBeInstanceOf(SqlStorage);
		await storage.deletePendingAuthorization('s');
		expect(executor).toHaveBeenCalledWith('DELETE FROM mcp_oauth_pending_authorizations WHERE state_id = ?', ['s']);
	});

	it('should build the sqlite schema', () => {
		expect(sqliteSchema()[0]).toContain('mcp_oauth_clients');
		expect(sqliteSchema('p_').join('\n')).not.toContain('BIGINT');
	});
});
