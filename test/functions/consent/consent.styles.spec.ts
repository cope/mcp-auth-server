'use strict';

import consentStyles from '../../../src/functions/consent/consent.styles';

describe('consent.styles tests', () => {
	it('should be defined', () => {
		expect(consentStyles).toBeDefined();
		expect(typeof consentStyles).toBe('string');
	});

	it('should contain the base rules', () => {
		expect(consentStyles).toContain('color-scheme:light dark');
		expect(consentStyles).toContain('button.approve');
	});
});
