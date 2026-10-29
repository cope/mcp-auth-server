'use strict';

import fromNodeSqlite from '../../../src/functions/sql/from.node.sqlite';

describe('from.node.sqlite tests', () => {
	it('should be defined', () => {
		expect(fromNodeSqlite).toBeDefined();
	});

	it('should return the rows of the prepared statement', () => {
		const all = jest.fn().mockReturnValue([{a: 1}]);
		const prepare = jest.fn().mockReturnValue({all});
		expect(fromNodeSqlite({prepare})('SELECT ?', [1])).toEqual([{a: 1}]);
		expect(prepare).toHaveBeenCalledWith('SELECT ?');
		expect(all).toHaveBeenCalledWith(1);
	});
});
