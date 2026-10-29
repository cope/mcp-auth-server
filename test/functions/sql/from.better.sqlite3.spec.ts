'use strict';

import fromBetterSqlite3 from '../../../src/functions/sql/from.better.sqlite3';

describe('from.better.sqlite3 tests', () => {
	it('should be defined', () => {
		expect(fromBetterSqlite3).toBeDefined();
	});

	it('should return rows for readers', () => {
		const all = jest.fn().mockReturnValue([{a: 1}]);
		const run = jest.fn();
		const prepare = jest.fn().mockReturnValue({reader: true, all, run});
		expect(fromBetterSqlite3({prepare})('SELECT ?', [1])).toEqual([{a: 1}]);
		expect(all).toHaveBeenCalledWith(1);
		expect(run).not.toHaveBeenCalled();
	});

	it('should run non-readers and return no rows', () => {
		const all = jest.fn();
		const run = jest.fn();
		const prepare = jest.fn().mockReturnValue({reader: false, all, run});
		expect(fromBetterSqlite3({prepare})('INSERT ?', [1])).toEqual([]);
		expect(run).toHaveBeenCalledWith(1);
		expect(all).not.toHaveBeenCalled();
	});
});
