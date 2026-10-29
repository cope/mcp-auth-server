'use strict';

import hasCredentials from '../../../src/functions/server/has.credentials';

describe('has.credentials tests', () => {
	it('should be defined', () => {
		expect(hasCredentials).toBeDefined();
		expect(typeof hasCredentials).toBe('function');
	});

	it('should detect a client_secret param', () => {
		expect(hasCredentials({method: 'POST', path: '/', query: {}, headers: {}}, {client_secret: 'x'})).toBe(true);
	});

	it('should detect an Authorization header', () => {
		expect(hasCredentials({method: 'POST', path: '/', query: {}, headers: {authorization: 'Basic abc'}}, {})).toBe(true);
	});

	it('should be false without either', () => {
		expect(hasCredentials({method: 'POST', path: '/', query: {}, headers: {}}, {})).toBe(false);
	});
});
