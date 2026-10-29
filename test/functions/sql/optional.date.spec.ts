'use strict';

import optionalDate from '../../../src/functions/sql/optional.date';

describe('optional.date tests', () => {
	it('should be defined', () => {
		expect(optionalDate).toBeDefined();
	});

	it('should return null when there is no date', () => {
		expect(optionalDate(undefined)).toBeNull();
	});

	it('should return the epoch milliseconds', () => {
		expect(optionalDate(new Date(1234))).toBe(1234);
	});
});
