'use strict';

import fromBunSqlite from '../../../src/functions/sql/from.bun.sqlite';

describe('from.bun.sqlite tests', () => {
	it('should be defined', () => {
		expect(fromBunSqlite).toBeDefined();
	});

	it('should return the rows of the query', () => {
		const all = jest.fn().mockReturnValue([{a: 1}]);
		const query = jest.fn().mockReturnValue({all});
		expect(fromBunSqlite({query})('SELECT ?', [1])).toEqual([{a: 1}]);
		expect(query).toHaveBeenCalledWith('SELECT ?');
		expect(all).toHaveBeenCalledWith(1);
	});
});
