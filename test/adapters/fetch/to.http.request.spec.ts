'use strict';

/* eslint-disable sonarjs/no-hardcoded-ip */

import toHttpRequest from '../../../src/adapters/fetch/to.http.request';

describe('to.http.request tests', () => {
	it('should be defined', () => {
		expect(toHttpRequest).toBeDefined();
		expect(typeof toHttpRequest).toBe('function');
	});

	it('should convert a GET request without reading a body', async () => {
		const parsed = await toHttpRequest(new Request('https://auth.test/authorize?client_id=abc'));

		expect(parsed.method).toBe('GET');
		expect(parsed.path).toBe('/authorize');
		expect(parsed.query).toEqual({client_id: 'abc'});
		expect(parsed.body).toBeUndefined();
		expect(parsed.ip).toBeUndefined();
	});

	it('should not read a body for HEAD requests', async () => {
		const parsed = await toHttpRequest(new Request('https://auth.test/authorize', {method: 'HEAD'}));

		expect(parsed.body).toBeUndefined();
	});

	it('should parse a form encoded POST body', async () => {
		const parsed = await toHttpRequest(
			new Request('https://auth.test/token', {
				method: 'POST',
				headers: {'content-type': 'application/x-www-form-urlencoded'},
				body: 'grant_type=refresh_token&refresh_token=r'
			})
		);

		expect(parsed.method).toBe('POST');
		expect(parsed.body).toEqual({grant_type: 'refresh_token', refresh_token: 'r'});
		expect(parsed.headers['content-type']).toBe('application/x-www-form-urlencoded');
	});

	it('should parse a JSON POST body', async () => {
		const parsed = await toHttpRequest(
			new Request('https://auth.test/register', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({redirect_uris: ['https://a.test/cb']})})
		);

		expect(parsed.body).toEqual({redirect_uris: ['https://a.test/cb']});
	});

	it('should collect repeated query parameters into arrays', async () => {
		const parsed = await toHttpRequest(new Request('https://auth.test/authorize?a=1&a=2&a=3&b=x'));

		expect(parsed.query).toEqual({a: ['1', '2', '3'], b: 'x'});
	});

	it('should prefer cf-connecting-ip for the client ip', async () => {
		const parsed = await toHttpRequest(new Request('https://auth.test/x', {headers: {'cf-connecting-ip': '1.1.1.1', 'x-real-ip': '2.2.2.2', 'x-forwarded-for': '3.3.3.3'}}));

		expect(parsed.ip).toBe('1.1.1.1');
	});

	it('should fall back to x-real-ip', async () => {
		const parsed = await toHttpRequest(new Request('https://auth.test/x', {headers: {'x-real-ip': '2.2.2.2', 'x-forwarded-for': '3.3.3.3'}}));

		expect(parsed.ip).toBe('2.2.2.2');
	});

	it('should fall back to the first x-forwarded-for element', async () => {
		const parsed = await toHttpRequest(new Request('https://auth.test/x', {headers: {'x-forwarded-for': ' 3.3.3.3 , 4.4.4.4'}}));

		expect(parsed.ip).toBe('3.3.3.3');
	});
});
