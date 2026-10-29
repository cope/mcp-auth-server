'use strict';

import fromPostgresJs from '../../../src/functions/sql/from.postgres.js';

describe('from.postgres.js tests', () => {
	it('should be defined', () => {
		expect(fromPostgresJs).toBeDefined();
	});

	it('should convert the array-like result to an array', async () => {
		const unsafe = jest.fn().mockResolvedValue({0: {a: 1}, length: 1});
		expect(await fromPostgresJs({unsafe})('SELECT $1', [1])).toEqual([{a: 1}]);
		expect(unsafe).toHaveBeenCalledWith('SELECT $1', [1]);
	});
});
