'use strict';

import toDialectSql from '../../../src/functions/sql/to.dialect.sql';

describe('to.dialect.sql tests', () => {
	it('should be defined', () => {
		expect(toDialectSql).toBeDefined();
	});

	it('should leave sqlite sql untouched', () => {
		expect(toDialectSql('SELECT ? , ?', 'sqlite')).toBe('SELECT ? , ?');
	});

	it('should number placeholders for postgres', () => {
		expect(toDialectSql('SELECT * FROM t WHERE a = ? AND b = ?', 'postgres')).toBe('SELECT * FROM t WHERE a = $1 AND b = $2');
	});

	it('should leave postgres sql without placeholders untouched', () => {
		expect(toDialectSql('SELECT 1', 'postgres')).toBe('SELECT 1');
	});
});
