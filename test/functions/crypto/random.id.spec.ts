'use strict';

import randomId from '../../../src/functions/crypto/random.id';

describe('random.id tests', () => {
	it('should be defined', () => {
		expect(randomId).toBeDefined();
		expect(typeof randomId).toBe('function');
	});

	it('should return a uuid v4', () => {
		expect(randomId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
	});

	it('should return a different value on every call', () => {
		expect(randomId()).not.toBe(randomId());
	});
});
