'use strict';

import fromD1 from '../../../src/functions/sql/from.d1';

const database = (results: Record<string, unknown>[] | undefined) => {
	const all = jest.fn().mockResolvedValue({results});
	const bind = jest.fn().mockReturnValue({all});
	const prepare = jest.fn().mockReturnValue({bind});
	return {prepare, bind, all};
};

describe('from.d1 tests', () => {
	it('should be defined', () => {
		expect(fromD1).toBeDefined();
	});

	it('should return the results', async () => {
		const db = database([{a: 1}]);
		expect(await fromD1(db)('SELECT ?', [1])).toEqual([{a: 1}]);
		expect(db.prepare).toHaveBeenCalledWith('SELECT ?');
		expect(db.bind).toHaveBeenCalledWith(1);
	});

	it('should return an empty array when there are no results', async () => {
		expect(await fromD1(database(undefined))('SELECT 1', [])).toEqual([]);
	});
});
