'use strict';

import McpAuthPostgres, {postgresStorage, postgresSchema, fromPg, fromPostgresJs, SqlStorage} from '../src/mcp.auth.postgres';

describe('mcp.auth.postgres tests', () => {
	it('should be defined', () => {
		expect(McpAuthPostgres).toBeDefined();
		expect(typeof McpAuthPostgres).toBe('object');
	});

	it('should export the public api', () => {
		expect(postgresStorage).toBeDefined();
		expect(postgresSchema).toBeDefined();
		expect(fromPg).toBeDefined();
		expect(fromPostgresJs).toBeDefined();
		expect(SqlStorage).toBeDefined();
	});

	it('should create a postgres storage', async () => {
		const executor = jest.fn().mockResolvedValue([]);
		const storage = postgresStorage(executor, {tablePrefix: 'p_'});
		expect(storage).toBeInstanceOf(SqlStorage);
		await storage.deletePendingAuthorization('s');
		expect(executor).toHaveBeenCalledWith('DELETE FROM p_pending_authorizations WHERE state_id = $1', ['s']);
	});

	it('should build the postgres schema', () => {
		expect(postgresSchema()[0]).toContain('mcp_oauth_clients');
		expect(postgresSchema('p_').join('\n')).toContain('BIGINT');
	});
});
