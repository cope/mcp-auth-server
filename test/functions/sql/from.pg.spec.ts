'use strict';

import fromPg from '../../../src/functions/sql/from.pg';

describe('from.pg tests', () => {
	it('should be defined', () => {
		expect(fromPg).toBeDefined();
	});

	it('should return the rows of the query result', async () => {
		const query = jest.fn().mockResolvedValue({rows: [{a: 1}]});
		expect(await fromPg({query})('SELECT $1', [1])).toEqual([{a: 1}]);
		expect(query).toHaveBeenCalledWith('SELECT $1', [1]);
	});
});
