'use strict';

import sqlSchema from '../../../src/functions/sql/sql.schema';

describe('sql.schema tests', () => {
	it('should be defined', () => {
		expect(sqlSchema).toBeDefined();
	});

	it('should use INTEGER and the default prefix for sqlite', () => {
		const statements = sqlSchema('sqlite');
		expect(statements).toHaveLength(9);
		expect(statements.join('\n')).toContain('mcp_oauth_clients');
		expect(statements.join('\n')).toContain('created_at INTEGER NOT NULL');
		expect(statements.join('\n')).not.toContain('BIGINT');
	});

	it('should use BIGINT and a custom prefix for postgres', () => {
		const statements = sqlSchema('postgres', 'x_');
		expect(statements.join('\n')).toContain('x_clients');
		expect(statements.join('\n')).toContain('expires_at BIGINT NOT NULL');
		expect(statements.join('\n')).not.toContain('mcp_oauth_');
	});
});
