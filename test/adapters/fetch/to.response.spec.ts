'use strict';

import toResponse from '../../../src/adapters/fetch/to.response';

describe('to.response tests', () => {
	it('should be defined', () => {
		expect(toResponse).toBeDefined();
		expect(typeof toResponse).toBe('function');
	});

	it('should produce a null body when the response body is undefined', () => {
		const response = toResponse({status: 302, headers: {location: 'https://a.test/'}});

		expect(response.status).toBe(302);
		expect(response.headers.get('location')).toBe('https://a.test/');
		expect(response.body).toBeNull();
	});

	it('should pass string bodies through', async () => {
		const response = toResponse({status: 200, headers: {'content-type': 'text/html'}, body: '<p>hi</p>'});

		expect(await response.text()).toBe('<p>hi</p>');
		expect(response.headers.get('content-type')).toBe('text/html');
	});

	it('should serialize object bodies as JSON', async () => {
		const response = toResponse({status: 201, headers: {'content-type': 'application/json'}, body: {ok: true}});

		expect(response.status).toBe(201);
		expect(await response.json()).toEqual({ok: true});
	});
});
